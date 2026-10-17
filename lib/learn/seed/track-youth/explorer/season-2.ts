import type { SeedLab, SeedModule } from "../../types";

// AI-Empowered Youth: Think, Build, Lead. Explorer lane (ages 10 to 13).
// Season 2: "Think sharper than the machine" (modules 4 to 7).
//
// Explorer lessons are short (10 to 12 minutes), concrete and playful, in
// simple words. Every lesson runs Learn → Play → Do → Reflect:
//   Learn: an everyday example from a young person's life in Africa or the US.
//   Play: a Learning Studio challenge (```studio) or a prompt to run on the
//         page (```try, which runs on ARFA's safe AI; no outside accounts).
//   Do:   a small task, ending in "## Try it now".
//   Reflect: one question at the end of that section.
// The thinking tools are named out loud every time: claim, evidence,
// reasoning; 5 Whys; systems maps; questioning assumptions.
//
// Safety: no personal data is asked for anywhere. Learners are told not to
// type their name, school, address or photos into any AI. Big feelings are
// always pointed to a trusted adult. Every example is illustrative.

// ═════════════════════════════════════════════════════════════════════════
// MODULE 4 · Fake or real?
// ═════════════════════════════════════════════════════════════════════════

const M4: SeedModule = {
  title: "Fake or real?",
  summary:
    "Become a fake-spotter. See how AI makes pictures, voices and text that look real, catch a chatbot making things up, and learn the fact-checker's habits: stop, check the source, look at what others say, and use claim, evidence, reasoning before you share anything.",
  lessons: [
    {
      title: "Can you trust your eyes?",
      objective: "Explain why a picture, video or voice note can look real and still be fake, and use the STOP habit before reacting to surprising content.",
      durationMinutes: 10,
      contentType: "article",
      isPreview: true,
      bodyMd: `## A shark on the motorway

Imagine this. It is raining hard in Lagos, and a picture lands in your family group chat. It shows a shark swimming down a flooded motorway, right next to a yellow bus. Your uncle has already added three shocked faces. Your cousin has forwarded it to two other groups.

Is it real?

A few years ago, making a picture like that took real skill and hours of editing. Today, AI tools can make a realistic picture from one sentence, in seconds. Some can also copy a person's voice from a short recording, or make a video of someone saying words they never said. A fake made with AI that copies a real person's face or voice is called a **deepfake**.

This does not mean everything is fake. Most of what you see is real. It means that **looking real is no longer proof that something is real**. That is a big change, and you are growing up right in the middle of it.

## Why fakes spread so fast

Fakes are often built to make you *feel* something quickly: shock, fear, laughter or anger. When we feel something strongly, we want to share it straight away. That is exactly what the person who made the fake is hoping for.

Here is the trick to remember: **the stronger the feeling, the slower you should go.** A surprising post is not a reason to share. It is a reason to check.

## The STOP habit

Fact-checkers (people whose job is checking whether things are true) have one habit before anything else. They stop. You can use the same habit in four steps:

- **S**top. Do not like, share or forward yet.
- **T**hink. How does this make me feel? Is it trying to make me feel something fast?
- **O**rigin. Where did it come from? Who first posted it? Do I know?
- **P**ause and check. Can I find the same thing somewhere I trust?

Notice that STOP does not ask "does it look real?" Your eyes can be fooled. Your thinking is harder to fool.

## Play: fake or real warm-up

Time to test your eyes and your thinking. In this challenge you will see a set of pictures and posts. Decide which ones are real and which were made or changed, and say what made you decide.

\`\`\`studio
fake-or-real:warm-up
\`\`\`

Did any of them fool you? That is normal. Even experts get fooled by good fakes. The point is not to have perfect eyes. It is to have a good habit.

## Try it now

Think of the last surprising thing you saw online or that someone forwarded to you: a picture, a video, a voice note or a message. You do not need to find it again or type it anywhere.

1. On paper, write the four letters S, T, O, P down the side.
2. Next to each letter, write what you would do with that post. For **O**, write who you think first made it, or "I don't know".
3. Decide: share, don't share, or check first?

You are done when you have a STOP card for one real post you saw.

**Reflect:** What feeling did that post give you, and did that feeling make you want to share it faster?`,
      microCheck: [
        {
          question: "A picture in your group chat looks completely real. What does that tell you?",
          options: [
            "Nothing for sure, because AI can make fakes that look real",
            "That it is real, because fakes always have something odd",
            "That it is fake, because real pictures are rarely shared",
            "That it is real if lots and lots of people have already shared it",
          ],
          correctIndex: 0,
          explanation:
            "AI can now make pictures that look completely real, so looking real is not proof. Lots of shares is not proof either, because fakes spread fast too.",
        },
        {
          question: "A video makes you feel really angry the second you see it. What should you do first?",
          options: [
            "Share it quickly so your friends can warn everyone they know",
            "Slow down, because strong feelings are a reason to check",
            "Reply to it angrily so the person who made it sees",
            "Delete the app so you never see any videos like it",
          ],
          correctIndex: 1,
          explanation:
            "Fakes are often made to stir up strong feelings so people share without thinking. The stronger the feeling, the slower you should go before you react.",
        },
        {
          question: "What is a deepfake?",
          options: [
            "A real video that was filmed deep underwater",
            "A secret message hidden inside a normal photo",
            "An AI fake that copies a real person's face or voice",
            "A website that collects every fake post online",
          ],
          correctIndex: 2,
          explanation:
            "A deepfake uses AI to copy a real person's face or voice so they seem to say or do something they never did. It is one kind of AI fake among many.",
        },
        {
          question: "In the STOP habit, what does the O step ask you to think about?",
          options: [
            "Whether the post has lots of likes and comments",
            "Whether the picture looks old or brand new",
            "Whether you could make a funny reply to it",
            "Where the post came from and who first made it",
          ],
          correctIndex: 3,
          explanation:
            "O stands for Origin: where it came from and who made it first. Likes and how new it looks do not tell you whether it is true.",
        },
      ],
    },
    {
      title: "Deepfake detective",
      objective: "Look for clues that a picture, video or voice may be AI-made, and check a suspicious voice message by contacting the person another way.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## A voice note from "your cousin"

Kwame is twelve and lives in Accra. One evening his phone buzzes with a voice note. It sounds exactly like his big cousin Ama: "Kwame, please, I'm stuck and my phone is dying. Send me airtime on this new number, quickly!"

It sounds like her. It uses her nickname for him. But something feels rushed. Kwame does not send anything. Instead he calls Ama on her usual number. She picks up, laughing. She is at home watching football, and her phone is fine.

Some AI tools can copy a voice from a short recording, like a video someone posted. Scammers use this to pretend to be people you know. Kwame did the smartest thing a detective can do: **he checked with the real person, using a different way to reach them.**

## Clues in pictures and videos

AI pictures and videos sometimes leave clues. Detectives call these **tells**. Here are some to look for:

- **Hands and fingers**: too many, too few, or bending in strange ways.
- **Writing**: signs, T-shirts and labels with letters that turn into nonsense.
- **Small details**: earrings that do not match, glasses melting into skin, hair that blurs into the background.
- **Light and shadows**: shadows going the wrong way, or a face lit differently from the room.
- **Too perfect**: skin as smooth as plastic, or a crowd where every face looks a bit the same.
- **In videos**: lips that do not quite match the words, or blinking that looks odd.

## Clues in voices

- The voice sounds flat, or the feelings do not match the words.
- Strange pauses or breathing in the wrong places.
- The message is **urgent** and asks for **money, airtime, a code or a secret**.

That last clue is the biggest one. A real emergency can wait one minute while you check.

## Important: clues are not proof

Here is something many grown-ups do not know. AI tools get better every few months, and the tells get harder to see. A fake with perfect hands can still be fake. A real photo can have a blurry hand.

So a tell is a reason to **check**, not a final answer. The best detectives use two kinds of clues:

1. **Inside clues**: what you see and hear in the picture, video or voice.
2. **Outside clues**: where it came from, who else is reporting it, and whether the real person confirms it.

Outside clues are usually stronger. That is why Kwame's phone call beat any amount of listening carefully.

## Play: spot the tells

In this challenge you will examine pictures and clips and point to the tells you can find. Be careful: some are real, and some fakes are very good.

\`\`\`studio
fake-or-real:deepfake-tells
\`\`\`

## Try it now

Make a **"Check before you send" plan** with your family. Do this out loud or on paper, not in any app.

1. Talk with a parent or carer about Kwame's story.
2. Agree on what you would do if a voice note or message asked you for money, airtime or a code. For example: hang up, then call the person on the number you already know.
3. Some families also agree a secret **family code word** that a real person could say if they truly needed help. Keep it secret: never type it into a chat or an AI.

You are done when your family has agreed one clear rule for urgent messages that ask for money or codes.

**Reflect:** Why is calling the real person back a stronger check than listening to the voice note again?`,
      microCheck: [
        {
          question: "A voice note sounds exactly like your aunt and asks you to send a code urgently. What is the best move?",
          options: [
            "Send it, because the voice sounds exactly like her",
            "Listen again very carefully for strange background noises",
            "Call your aunt on the number you already have for her",
            "Reply to the voice note and ask if it is really her",
          ],
          correctIndex: 2,
          explanation:
            "Voices can be copied with AI, so even a perfect match is not proof. Contacting the real person a different way is the strongest check, and replying to the same message only reaches whoever sent it.",
        },
        {
          question: "A picture has perfect hands and clear writing on a sign. What can you say about it?",
          options: [
            "It must be real, because AI always gets hands wrong",
            "It could still be fake, because tells are getting harder to see",
            "It must be fake, because real photos are never that sharp and clear",
            "It is real if the writing on the sign is in English",
          ],
          correctIndex: 1,
          explanation:
            "AI tools keep improving, so a picture with no tells can still be fake. Missing tells mean you need outside clues, like where it came from.",
        },
        {
          question: "Which of these is an outside clue rather than an inside clue?",
          options: [
            "Whether trusted news sites are reporting the same thing",
            "Whether the person in the video blinks in a normal way",
            "Whether the shadows fall the right way in the picture",
            "Whether the letters on a T-shirt look like real words",
          ],
          correctIndex: 0,
          explanation:
            "Outside clues come from beyond the picture itself: who made it, where it came from, and who else reports it. Blinking, shadows and writing are inside clues.",
        },
        {
          question: "Why do scam messages that copy a voice usually sound urgent?",
          options: [
            "Because AI voices can only speak quickly",
            "Because real people never leave slow or calm voice messages",
            "Because urgent messages are cheaper to send",
            "Because rushing you stops you from checking first",
          ],
          correctIndex: 3,
          explanation:
            "Scammers create a rush so you act before you think or check. A real emergency can wait the one minute it takes to call the person back.",
        },
      ],
    },
    {
      title: "When AI makes things up",
      objective: "Show that a chatbot can invent facts that sound true, and explain why you check its answers before using them.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## The book that never existed

Maya is eleven and lives in Houston. She has a school project on space and asks a chatbot for "three good books about Mars for kids". It gives her three titles, each with an author's name and a short summary. They sound perfect.

At the library, the librarian searches for them. The first book is real. The second one is real but by a different author. The third one does not exist at all. The chatbot made it up: the title, the author and the summary.

This has a name. When an AI makes up something that is not true and says it confidently, people call it a **hallucination**.

## Why does AI make things up?

A chatbot is not looking things up in a giant book of facts. It learned from a huge amount of writing, and it builds each answer by guessing which words are likely to come next. It is very, very good at guessing, so its answers usually sound smooth and sure.

But "sounds likely" is not the same as "is true". If it does not have the right information, it may still produce something that *sounds* like a good answer. It does not feel unsure the way you do. It just keeps writing.

Some chatbots can search the web, and that helps. But they can still mix things up. So here is the rule: **a confident answer is not a checked answer.**

## When to be extra careful

AI is most likely to make things up when you ask for:

- **Names of books, websites or experts** (it may invent them).
- **Exact numbers and dates**.
- **Things about your local area**, like your town or school.
- **Very new news**, or things few people have written about.
- Quotes: "What did this famous person say about...?"

AI is more helpful for things like explaining an idea in simpler words, giving you practice questions, or helping you plan. Even then, you are the boss of the answer.

## Play: try to catch it out

Let us test it. Use the prompt below in the practice pad. It asks about an invention that does not exist. Change the made-up name if you like.

\`\`\`try
Tell me about the famous inventor [MADE-UP NAME] from [A REAL CITY] who invented the flying bicycle. When did they invent it, and how does it work?
\`\`\`

Read the answer. Did the AI say it could not find this person, or did it invent a story? Good AI tools are trained to say "I don't know", and many now do. If it played along, you just watched a hallucination happen. If it said it did not know, that is a good sign, but it does not mean every answer it gives is true.

Now try a second test on something you know a lot about, like your favourite game or football team:

\`\`\`try
Tell me five facts about [SOMETHING YOU KNOW A LOT ABOUT]. For each fact, tell me how sure you are.
\`\`\`

Check every fact using what you already know. Did it get any wrong?

## Try it now

Use a simple thinking tool called **claim, evidence, reasoning**:

- **Claim**: what is being said. ("This book exists.")
- **Evidence**: what proves it. ("The library has it" or "I found it on the publisher's website.")
- **Reasoning**: why the evidence proves the claim. ("A library catalogue lists real books.")

Pick one fact from your second test above. On paper, write the claim, then find evidence for it somewhere other than the chatbot: a schoolbook, a trusted website, or an adult who knows. Write one sentence of reasoning.

You are done when you have checked one AI fact with evidence from a different source.

**Reflect:** If an AI answer sounds really confident, does that make it more likely to be true? Why or why not?`,
      microCheck: [
        {
          question: "A chatbot gives you a book title, an author and a summary for your project. What should you do?",
          options: [
            "Use it, because a summary shows the book is real",
            "Check the book exists in a library or a trusted website",
            "Ask the chatbot the same question again to confirm it is real",
            "Use it only if the author's name sounds real",
          ],
          correctIndex: 1,
          explanation:
            "Chatbots can invent whole books, authors and summaries. Asking the same chatbot again is not a real check, so look for the book somewhere else.",
        },
        {
          question: "Why can a chatbot make up an answer and still sound sure?",
          options: [
            "It is trying to trick you on purpose",
            "It copies the answer from the last person who asked",
            "It guesses likely words and does not feel unsure",
            "It only makes mistakes when its battery is low",
          ],
          correctIndex: 2,
          explanation:
            "A chatbot builds answers by guessing likely words. It does not feel doubt like a person, so a made-up answer can sound just as sure as a true one.",
        },
        {
          question: "Which question is a chatbot MOST likely to get wrong?",
          options: [
            "Explain what photosynthesis means in simple words",
            "Give me five practice questions on times tables",
            "Help me make a plan for revising this weekend",
            "What exact words did the mayor of my town say last week?",
          ],
          correctIndex: 3,
          explanation:
            "Exact quotes, local details and very recent news are where chatbots often make things up. Explaining ideas and making practice questions are safer uses, though you still check.",
        },
        {
          question: "In claim, evidence, reasoning, what counts as good evidence that a fact is true?",
          options: [
            "A trusted source, different from the chatbot, that agrees",
            "The chatbot saying it is very sure about the fact",
            "A friend saying they think they heard it somewhere at school",
            "The fact appearing in a long and detailed answer",
          ],
          correctIndex: 0,
          explanation:
            "Good evidence comes from a separate, trustworthy source. The chatbot's own confidence, a long answer or a half-remembered rumour do not prove anything.",
        },
      ],
    },
    {
      title: "Check before you share",
      objective: "Check a claim like a fact-checker by reading sideways to other sources, and use claim, evidence, reasoning to decide whether to share it.",
      durationMinutes: 12,
      contentType: "article",
      bodyMd: `## "School is closed tomorrow!"

Tunde is thirteen and lives in Abuja. At 9 pm a message appears in his class group: "BREAKING: all schools closed tomorrow because of the storm. Forward to everyone!" There is a logo at the top that looks official.

Half the class starts celebrating. Tunde wants to forward it too. But he remembers what you have been learning, and he stops. Who sent this? Where did it start? Is anyone else saying it?

He checks the official school page and the state's education page. Nothing. He asks his mum, who checks the local radio station's website. Nothing there either. The next morning, school is open. The kids who stayed home had to explain themselves.

## Read sideways, not just down

When most people check a post, they read it again more carefully, top to bottom. They look at the logo, the spelling and how official it sounds. But fakers are good at making things look official.

Professional fact-checkers do something different. They **leave the post** and open new tabs to see what *other* sources say about it. This is called **lateral reading**, which means reading sideways. Instead of asking "does this look true?", they ask "what do other trusted sources say?"

Lateral reading questions:

1. **Who is behind this?** Search the name of the website or account. What do others say about it?
2. **Is anyone trusted reporting the same thing?** Official pages, well-known news sites, your school.
3. **Where did it start?** Can you find the very first version? Fakes often lose their origin as they are forwarded.

## Claim, evidence, reasoning

You met this thinking tool in the last lesson. Here it is again, used to decide whether to share:

- **Claim**: "All schools are closed tomorrow."
- **Evidence**: The school's own page says nothing. The state page says nothing. Local radio says nothing.
- **Reasoning**: If schools really closed, the official pages would say so. They don't, so the claim is probably false.
- **Decision**: Do not forward. Tell the group you could not find it anywhere official.

## Play: the fact-check challenge

In this challenge you get a set of claims and posts. For each one, choose the best way to check it, collect evidence and make a call: true, false, or not sure yet. "Not sure yet" is an honest and smart answer.

\`\`\`studio
fake-or-real:fact-check
\`\`\`

## Let AI help you ask better questions

AI should not be your only fact-checker, because it can make things up. But it can help you plan *how* to check. Try this:

\`\`\`try
I saw this claim online: "[A CLAIM YOU HAVE HEARD, WITH NO NAMES OF REAL PEOPLE YOU KNOW]". Do not tell me if it is true. Instead, give me three questions I should ask and three kinds of trusted sources I could check to find out myself.
\`\`\`

Notice the prompt says "do not tell me if it is true". You are using the AI as a coach for your thinking, not a judge.

## Try it now

Pick a rumour you have heard at school or online. Some ideas: "eating at night makes you grow taller", "a new phone will be free for students", "this game is shutting down next month".

1. Write the **claim** in one sentence.
2. Find **evidence**: check at least two sources that are not the post itself (with an adult if you need to search).
3. Write your **reasoning** in one or two sentences.
4. Make your **decision**: share, don't share, or not sure yet.

You are done when you have a full claim, evidence, reasoning card and a decision.

**Reflect:** Why is "not sure yet" sometimes the most honest answer you can give?`,
      microCheck: [
        {
          question: "A post has an official-looking logo and says school is closed. What does a fact-checker do first?",
          options: [
            "Zoom into the logo to see if it looks real and official enough",
            "Check what official and trusted sources say about it",
            "Forward it with a note saying it might be fake",
            "Count how many people have shared it already",
          ],
          correctIndex: 1,
          explanation:
            "Fakers can copy logos easily. Lateral reading means leaving the post and checking what official and trusted sources say, which is much harder to fake.",
        },
        {
          question: "What does lateral reading mean?",
          options: [
            "Reading a post very slowly, line by line",
            "Reading only the comments under a post",
            "Opening other sources to see what they say about it",
            "Reading a post out loud to someone sitting right next to you",
          ],
          correctIndex: 2,
          explanation:
            "Lateral reading means reading sideways: leaving the post to see what other trusted sources say about it and about who made it.",
        },
        {
          question: "You checked three trusted sources and found nothing about a claim. What is the best decision?",
          options: [
            "Do not share it, and say you could not confirm it",
            "Share it, because nobody has said it is false",
            "Share it with a laughing emoji just in case",
            "Keep checking every website until you find it",
          ],
          correctIndex: 0,
          explanation:
            "If trusted sources would report something real and they don't, the claim is probably false or unconfirmed. Not sharing stops a possible fake spreading.",
        },
        {
          question: "Why does the AI prompt in this lesson say \"do not tell me if it is true\"?",
          options: [
            "Because AI is never allowed to talk about the news",
            "Because the answer would cost too much to make",
            "Because AI always gets every fact-checking question wrong",
            "Because you use AI to coach your checking, not to judge",
          ],
          correctIndex: 3,
          explanation:
            "AI can make things up, so it should not be your only judge. Using it to suggest questions and sources keeps you doing the real checking.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "Your friend shows you a video of a famous footballer saying something shocking. It looks totally real. What is the smartest first thought?",
      options: [
        "Looking real is not proof, so I should check before believing it",
        "It must be real, because nobody could fake a famous person",
        "It must be fake, because famous people never say shocking things",
        "It is real if my friend says they saw it on a big account",
      ],
      correctIndex: 0,
      explanation:
        "AI can make realistic videos of real people. The smart move is to treat realism as not enough and check outside clues, like whether trusted sources report it.",
    },
    {
      question: "Which feeling is the biggest warning sign that you should slow down before sharing?",
      options: [
        "Feeling a little bored by the post",
        "Feeling a strong rush of shock or anger",
        "Feeling unsure what the post means",
        "Feeling sleepy while scrolling at night",
      ],
      correctIndex: 1,
      explanation:
        "Fakes are often designed to stir up strong feelings so people share without thinking. The stronger the feeling, the slower you should go.",
    },
    {
      question: "A chatbot gives you the name of an expert and a quote for your homework. What is the risk?",
      options: [
        "The chatbot may tell your teacher that you used it",
        "The quote will be too long to fit in your homework",
        "The expert or the quote could be completely made up",
        "The expert may ask you for money to use their quote",
      ],
      correctIndex: 2,
      explanation:
        "Chatbots can invent names, quotes and books that sound real. That is called a hallucination, so names and quotes must always be checked elsewhere.",
    },
    {
      question: "What is the BEST way to check whether a message really came from your cousin?",
      options: [
        "Look closely at the spelling in the message",
        "Ask the sender to promise it is really them",
        "Check if the profile picture looks like your cousin",
        "Contact your cousin using a way you already know",
      ],
      correctIndex: 3,
      explanation:
        "Profile pictures, promises and spelling can all be faked. Reaching the real person through a channel you already trust is the strongest check.",
    },
    {
      question: "An AI picture has no strange hands, no odd writing and good shadows. What should you conclude?",
      options: [
        "Missing tells do not prove it is real, so check where it came from",
        "It is definitely real, because fakes always have at least one tell",
        "It is definitely fake, because real photos always have flaws",
        "It does not matter, because pictures are just for fun anyway",
      ],
      correctIndex: 0,
      explanation:
        "AI tools keep getting better, so good fakes may show no tells at all. Outside clues, like the origin and other reports, matter more.",
    },
    {
      question: "Amina reads a post again and again, top to bottom, to decide if it is true. What would a fact-checker suggest?",
      options: [
        "Keep reading it until every word makes sense",
        "Leave the post and see what other trusted sources say",
        "Read it backwards to find any hidden messages",
        "Ask the person who posted it if it is true",
      ],
      correctIndex: 1,
      explanation:
        "Fact-checkers read laterally: they leave the post and check what other sources say about the claim and who made it. Rereading the same post cannot reveal who made it.",
    },
    {
      question: "In claim, evidence, reasoning, which of these is the REASONING part?",
      options: [
        "The game is shutting down next month",
        "The game company's official page says nothing about it",
        "If it were true, the company's own page would mention it",
        "A friend at school told me about it at break time",
      ],
      correctIndex: 2,
      explanation:
        "Reasoning explains why the evidence supports or does not support the claim. The first option is the claim, the official page is evidence and the friend is a weak source.",
    },
    {
      question: "When are chatbots most likely to make things up?",
      options: [
        "When you ask them to explain a big idea simply",
        "When you ask them for practice questions on a topic",
        "When you ask them to help you plan your week",
        "When you ask for exact quotes, dates or local details",
      ],
      correctIndex: 3,
      explanation:
        "Exact quotes, numbers, dates, local details and very new news are where hallucinations are most common. Explaining and practising are safer uses, though you still stay in charge.",
    },
    {
      question: "You cannot find any trusted source for a claim yet, but you are not sure it is false either. What should you say?",
      options: [
        "\"Not sure yet\", and wait before sharing it",
        "\"True\", because nobody has proved it wrong",
        "\"False\", because you could not find it right now",
        "Share it and let other people work it out",
      ],
      correctIndex: 0,
      explanation:
        "\"Not sure yet\" is honest when the evidence is not in. Sharing an unchecked claim helps it spread, whether it turns out true or false.",
    },
    {
      question: "Why do some families agree a secret code word?",
      options: [
        "To unlock each other's phones when batteries die",
        "To check a real person is asking for help, not a copy",
        "To post in the family group without anyone reading",
        "To give to chatbots so they know who you are",
      ],
      correctIndex: 1,
      explanation:
        "A code word known only to the family helps check that an urgent request is from the real person, not an AI copy of their voice. It must never be typed into a chat or an AI.",
    },
  ],
};
// ═════════════════════════════════════════════════════════════════════════
// MODULE 5 · Systems are everywhere
// ═════════════════════════════════════════════════════════════════════════

const M5: SeedModule = {
  title: "Systems are everywhere",
  summary:
    "Learn to see the hidden machinery behind everyday things: the lunch queue, a game's coins, a football team, a family shop, the traffic outside school. Map parts and connections, spot loops that grow and loops that balance, find the bottleneck, and fix problems without causing new ones.",
  lessons: [
    {
      title: "What is a system?",
      objective: "Describe a system you know by naming its parts, its connections, its inputs and outputs, and its purpose.",
      durationMinutes: 10,
      contentType: "article",
      bodyMd: `## The lunch queue mystery

Every day at Zara's school in Atlanta, the lunch queue is painfully slow. Someone suggests a fix: open the doors to the dining hall five minutes earlier. They try it. The queue is still slow. Why?

To answer that, you need to stop looking at one thing and start looking at **the whole system**.

A **system** is a group of parts that are connected and work together to do something. The lunch queue is not just a line of hungry kids. It is:

- **Parts**: students, the serving staff, the trays, the food counter, the till where you pay, the tables.
- **Connections**: students move from door to trays to food to till to tables. If one part is slow, everything behind it waits.
- **Purpose**: get everyone fed before the bell.

Opening the doors earlier did not help because the slow part was not the door. It was the till, where one person checked every student's lunch card. Kids just waited at the till instead of at the door.

## Inputs and outputs

Systems take things in and give things out.

- **Inputs** go in: hungry students, food from the kitchen, time.
- **Outputs** come out: fed students, empty plates, waste, and sometimes grumpy people who did not get to eat.

When you look at inputs and outputs, you start asking better questions. Where does the food waste go? What happens when more students arrive than there is food for?

## Systems are everywhere

Once you see systems, you cannot stop seeing them.

- **A football team**: parts are players, coach, ball, pitch, tactics. Connections are passes and positions. The purpose is to score more than the other team. A great striker with no one passing to them scores nothing.
- **Your family's morning**: parts are people, one bathroom, breakfast, the bus. If the bathroom is busy, everyone is late.
- **A phone game**: players, coins, items, levels, the shop. Change one rule and the whole game feels different.

The big idea: **in a system, you cannot change one part without affecting others.** That is why "obvious" fixes so often fail.

## Play: fix the lunch queue

In this challenge you get a slow lunch queue to explore. Find the parts, follow the connections, and test changes to see what really speeds it up.

\`\`\`studio
system-mapper:lunch-queue
\`\`\`

Did your first idea work? If not, what did the system teach you?

## Try it now

Draw a **systems map** of your own morning, from waking up to arriving at school.

1. Write each **part** in a bubble: people, places, things (for example: alarm, bathroom, breakfast, bus, shoes that are never where they should be).
2. Draw **arrows** to connect parts that affect each other.
3. Write the **inputs** on the left (time, food, sleep) and the **outputs** on the right (on time or late, mood).
4. Circle the part that most often makes the whole morning go wrong.

You are done when your map has at least six parts, arrows between them, and one circled trouble spot.

**Reflect:** If you fixed only the circled part, what else in your morning might change?`,
      microCheck: [
        {
          question: "Which of these best describes a system?",
          options: [
            "Connected parts that work together for a purpose",
            "Any big machine that runs on electricity at school",
            "A list of rules that someone writes down on paper",
            "A single object that does one simple job all day",
          ],
          correctIndex: 0,
          explanation:
            "A system is connected parts working together for a purpose. It does not need electricity or written rules: a lunch queue and a football team are systems too.",
        },
        {
          question: "A school opens the dining hall earlier, but the lunch queue is just as slow. What is the most likely reason?",
          options: [
            "The students walked more slowly because they had more time",
            "The slow part was somewhere else, like the till",
            "Opening early always makes queues slower in every school",
            "The food was cooked differently because of the new time",
          ],
          correctIndex: 1,
          explanation:
            "If the slowest part of the system is the till, changing the door does not help. People just wait at the till instead. You have to find where the hold-up really is.",
        },
        {
          question: "In a football team system, which of these is an INPUT?",
          options: [
            "Goals scored at the end of the match",
            "The final league table at the end of the season",
            "Training time and the players' energy",
            "The cheers from fans after the final whistle",
          ],
          correctIndex: 2,
          explanation:
            "Inputs go into the system, like training time and energy. Goals, cheers and league positions are outputs: what comes out.",
        },
        {
          question: "What is the big lesson about changing one part of a system?",
          options: [
            "Only the biggest part of a system matters",
            "Changing one part never makes any difference",
            "Every part can be changed without any effects",
            "Changing one part usually affects other parts",
          ],
          correctIndex: 3,
          explanation:
            "Parts are connected, so a change in one place spreads to others. That is why obvious fixes sometimes fail or cause new problems somewhere else.",
        },
      ],
    },
    {
      title: "Inside a game economy",
      objective: "Explain how coins flow into and out of a game, and show how a loop that keeps growing can break a game's economy.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## Why did the sword cost so much?

Daniel is twelve and lives in Nairobi. He plays an online farming game with his friends. When it launched, a golden hoe cost 100 coins. Three months later it costs 5,000 coins in the player market. Nobody changed the price on purpose. So what happened?

The game has an **economy**: a system of coins, items and players. Let us look inside.

## Where coins come from and where they go

Every game economy has:

- **Taps** (also called sources): ways coins come **in**. Daily rewards, finishing quests, selling crops.
- **Drains** (also called sinks): ways coins go **out**. Buying seeds, paying to repair tools, entry fees for events.
- **The pool**: all the coins players are holding right now.

Think of a bath. Taps fill it. The plughole drains it. If the taps run faster than the drain, the bath fills up and up until it overflows.

In Daniel's game, players found a way to farm coins very fast, but there was not much to spend them on. The bath overflowed. Everyone had lots of coins, so sellers asked for more coins for rare items, and buyers paid it. Prices rose and rose. In real-world economies this is called **inflation**: when there is a lot more money around, each coin buys less.

New players suffered most. They started with 50 coins in a world where nothing good cost less than 1,000.

## A loop that keeps growing

Here is the most important idea in this lesson. Look at this chain:

> More coins → buy better tools → farm faster → more coins → buy even better tools...

The end of the chain feeds back into the start. That is a **feedback loop**. This one makes itself bigger and bigger each time round, so it is called a **reinforcing loop**. You can spot one when "more leads to more".

Reinforcing loops are everywhere:

- A video gets views, so it gets recommended more, so it gets even more views.
- A rumour is shared, so more people see it, so more people share it.
- You practise a skill, get better, enjoy it more, practise more. (Not all reinforcing loops are bad!)

In a game, a reinforcing loop with nothing to slow it down means the richest players get richer much faster than anyone else.

## How game designers fix it

Good designers watch the taps and drains. They might add new things worth spending coins on (bigger drains), make coin rewards smaller (slower taps), or add limits, like a maximum number of coins you can earn each day. Each fix changes how players behave, so designers test carefully.

## Play: balance the game economy

In this challenge you run a game economy. Adjust the taps and drains and watch what happens to prices and to new players. Can you keep the game fair and fun?

\`\`\`studio
system-mapper:game-economy
\`\`\`

## Try it now

Pick a game you know (a phone game, a board game like Monopoly, or a playground game with swaps, like trading cards).

1. List its **taps**: how do players get coins, points or items?
2. List its **drains**: how do they lose or spend them?
3. Find one **reinforcing loop** and write it as a chain with arrows, ending where it started.
4. Suggest one change that would slow that loop down.

You are done when you have a list of taps and drains, one loop drawn as a chain, and one change.

**Reflect:** In the game you chose, who does the reinforcing loop help most, and who gets left behind?`,
      microCheck: [
        {
          question: "In a game economy, what is a \"drain\" (or sink)?",
          options: [
            "A way that players earn free coins every single day",
            "A way that coins leave the game, like spending",
            "A secret level where players hide their coins",
            "A bug that copies coins when you trade them",
          ],
          correctIndex: 1,
          explanation:
            "Drains are ways coins go out of the game, such as buying seeds or paying for repairs. Taps are ways coins come in, like daily rewards.",
        },
        {
          question: "Players earn coins much faster than they can spend them. What usually happens to prices in the player market?",
          options: [
            "They fall, because everyone has fewer coins left",
            "They stay the same, because prices are fixed forever",
            "They rise, because there are lots of coins around",
            "They disappear, because the shop closes down",
          ],
          correctIndex: 2,
          explanation:
            "When there are lots more coins around, sellers ask for more and buyers pay it, so each coin buys less. That is inflation, and it hits new players hardest.",
        },
        {
          question: "Which of these is a reinforcing loop?",
          options: [
            "A video gets views, gets recommended more, then gets more views",
            "You get hungry, eat lunch, then feel full and stop eating lunch",
            "A room gets cold, the heater turns on, and the room warms up again",
            "A shop runs low on bread, orders more, and the shelf fills up",
          ],
          correctIndex: 0,
          explanation:
            "In a reinforcing loop, more leads to more: views lead to recommendations, which lead to more views. The other three are loops that push things back to normal.",
        },
        {
          question: "A game has a loop where rich players get richer faster and faster. What would a designer most likely do?",
          options: [
            "Give every player double coins so the game feels fairer",
            "Remove the shop so that nobody can buy anything",
            "Hide the coin totals so players stop noticing it",
            "Add new things to spend on and limit daily earnings",
          ],
          correctIndex: 3,
          explanation:
            "Bigger drains and limits on taps slow the runaway loop. Doubling coins would make inflation worse, and hiding totals does not change the system.",
        },
      ],
    },
    {
      title: "Loops that balance, and why things lag",
      objective: "Tell a balancing loop from a reinforcing loop, and explain how a delay or a bottleneck can make a system behave strangely.",
      durationMinutes: 12,
      contentType: "article",
      bodyMd: `## The shower that will not behave

Esi is eleven and lives in Kumasi. When she turns on the shower, it is cold. She turns the tap towards hot. Still cold. She turns it more. Suddenly, it is boiling! She turns it back towards cold. Freezing again!

What went wrong? The tap was fine. The problem was a **delay**: the hot water took a few seconds to travel up the pipe. Esi kept turning the tap before the water had time to change. By the time it did, she had turned it too far.

## Balancing loops: back to normal

In the last lesson you met **reinforcing loops**, where more leads to more. There is a second kind of loop. A **balancing loop** pushes things back towards a goal.

- You feel hungry → you eat → you feel full → you stop eating.
- A room gets cold → the heater turns on → the room warms up → the heater turns off.
- Esi's shower is too cold → she turns towards hot → it warms up → she stops turning.

A balancing loop always has a **goal** (being full, a comfy room, a nice shower) and it works to close the gap between "how it is" and "how I want it".

Quick test: reinforcing loops **grow** or **crash**. Balancing loops **steady** things.

## Delays make loops wobble

Balancing loops work well when the feedback is fast. Add a **delay** and they start to wobble, like Esi's shower. Delays are everywhere:

- A family shop in Dar es Salaam orders bread on Monday, but it arrives on Thursday. If they see empty shelves on Tuesday and order again, they might end up with far too much bread on Friday.
- You water a plant, but it takes days to perk up. If you keep adding water because "nothing is happening", you drown it.

When there is a delay, **wait and watch before you push harder.**

## Bottlenecks: the narrow neck

Imagine pouring water out of a bottle. However big the bottle, the water can only come out as fast as the narrow neck allows. In a system, the slowest step is called the **bottleneck**.

At Esi's school, all 300 students use one water tap at break time. It does not matter how fast you run to it. The tap is the bottleneck. Making the corridors wider would not help. A second tap would.

**Golden rule: to speed up a system, speed up the bottleneck.** Speeding up any other part just makes people wait at the bottleneck instead.

## Play: loops in action

In this challenge you will meet systems with loops and delays. Label each loop as reinforcing or balancing, and see what a delay does when you push too hard.

\`\`\`studio
system-mapper:feedback-loops
\`\`\`

## Try it now

Think about your school day or your home.

1. Find one **balancing loop**. Write it as a chain that comes back to the start, and name its goal.
2. Find one **delay**: something where the result shows up later than the action (studying for a test, growing a plant, saving pocket money).
3. Find one **bottleneck**: a place where everyone has to wait for one slow thing (one bathroom, one microwave, one charging cable).
4. Suggest one change to the bottleneck.

You are done when you have written down one balancing loop with its goal, one delay and one bottleneck with a fix.

**Reflect:** Can you remember a time you pushed harder because nothing seemed to be happening, and it turned out you just needed to wait?`,
      microCheck: [
        {
          question: "What makes a loop a balancing loop?",
          options: [
            "It keeps growing bigger and bigger every time it goes round",
            "It only happens in machines and never in people",
            "It pushes things back towards a goal it is aiming for",
            "It has exactly two parts and no more than that",
          ],
          correctIndex: 2,
          explanation:
            "A balancing loop works to close the gap between how things are and a goal, like eating until you are full. Reinforcing loops are the ones that keep growing.",
        },
        {
          question: "A shop sees empty shelves and orders more bread every day, but deliveries take three days. What is likely to happen?",
          options: [
            "The shop ends up with far too much bread on Friday",
            "The shop always has exactly the right amount",
            "The bread arrives faster because of all the extra orders",
            "The customers stop buying bread altogether",
          ],
          correctIndex: 0,
          explanation:
            "Because of the delay, the shop keeps ordering before earlier orders arrive. When everything lands at once, there is far too much. With delays, wait and watch before pushing harder.",
        },
        {
          question: "Three hundred students share one water tap at break. What will make the queue fastest?",
          options: [
            "Letting students run faster down all the long corridors",
            "Adding another tap, because the tap is the bottleneck",
            "Making break time start a little bit earlier",
            "Painting arrows on the floor to show the way",
          ],
          correctIndex: 1,
          explanation:
            "The tap is the slowest step, so it limits the whole system. Speeding up anything else just means people wait at the tap instead.",
        },
        {
          question: "Esi's shower goes from freezing to boiling and back. What is really causing it?",
          options: [
            "The tap is broken and needs replacing",
            "The water heater is far too powerful for a small shower",
            "Esi does not know which way is hot",
            "A delay before the water temperature changes",
          ],
          correctIndex: 3,
          explanation:
            "The hot water takes time to arrive, so Esi turns the tap too far before she feels the change. A delay in a balancing loop causes this kind of wobble.",
        },
      ],
    },
    {
      title: "Fix it without breaking it",
      objective: "Use the 5 Whys to find the root of a problem, predict a side effect of a fix, and choose a fix at a leverage point.",
      durationMinutes: 12,
      contentType: "article",
      bodyMd: `## The traffic outside school

Every morning, the road outside Chidi's school in Enugu is jammed. Cars stop in the middle of the road to drop kids off. Buses cannot get through. Everyone is late and grumpy.

The head teacher has an idea: build a big new drop-off area. It costs a lot and takes a year. When it opens, the traffic is smooth... for a few weeks. Then more parents start driving, because now it is easy. Soon the jam is back, bigger than before.

This is an **unintended consequence**: a result nobody planned. The fix made driving easier, so more people drove. It was a reinforcing loop hiding in plain sight.

## Ask why five times

Before you fix a problem, find its **root cause**: the deepest reason it happens. A simple thinking tool is the **5 Whys**. You ask "why?" and then ask "why?" about the answer, again and again, about five times.

1. Why is the road jammed? *Because lots of cars stop at the gate.*
2. Why do lots of cars come? *Because many parents drive their kids.*
3. Why do they drive? *Because walking feels unsafe.*
4. Why does walking feel unsafe? *Because there is no crossing on the main road.*
5. Why is there no crossing? *Because nobody has asked the council for one.*

Look where we ended up. The first idea was "build a bigger car park". The 5 Whys points to "get a safe crossing". That is a smaller, cheaper fix that could take cars off the road altogether.

You will not always get exactly five whys, and sometimes there is more than one root cause. That is fine. The point is to keep digging past the first answer.

## Leverage points: small push, big change

A **leverage point** is a place in a system where a small change makes a big difference. A lever lets you lift something heavy with a small push, if you push in the right place.

In the school traffic system, some possible fixes:

- **Weak lever**: paint more lines on the road. (People still drive.)
- **Medium lever**: a "walking bus", where an adult walks a group of kids to school along a set route. (Changes how some families travel.)
- **Strong lever**: a safe crossing plus a reward for classes that walk most. (Changes the reason people drive, and the goal people aim for.)

Strong levers usually change **rules, goals or the reasons people do things**, not just numbers.

## Ask AI to question your fix

AI is a good partner for finding side effects, as long as you do the thinking. Try this in the practice pad:

\`\`\`try
I want to fix this problem: [A PROBLEM AT SCHOOL OR HOME, NO REAL NAMES]. My fix is: [YOUR IDEA]. Do not tell me if my fix is good. Ask me "why" questions, one at a time, to help me find the root cause. Then help me think of one thing that could go wrong because of my fix.
\`\`\`

## Try it now

Pick a real problem you see often: the class is always noisy after break, the family shop runs out of the same item, your team keeps losing in the last ten minutes.

1. Do the **5 Whys** on paper. Write each why and each answer.
2. Write one fix for the **root cause** you found.
3. Write one **unintended consequence** your fix might cause.
4. Is your fix a weak, medium or strong lever? Say why.

You are done when you have five (or close to five) whys, a fix, a possible side effect and a lever rating.

**Reflect:** Was your first idea for a fix the same as your idea after the 5 Whys? What changed?`,
      microCheck: [
        {
          question: "A bigger drop-off area makes driving easier, so more parents drive and the jam returns. What is this called?",
          options: [
            "A bottleneck in the traffic system",
            "A leverage point",
            "A balancing loop",
            "An unintended consequence",
          ],
          correctIndex: 3,
          explanation:
            "An unintended consequence is a result nobody planned. Here the fix made driving easier, which created more traffic, the opposite of what was wanted.",
        },
        {
          question: "What is the point of the 5 Whys?",
          options: [
            "To dig past the first answer and find the root cause",
            "To give five different people in the class a turn to speak up",
            "To make a list of five fixes and pick the cheapest",
            "To check whether a problem happens five days a week",
          ],
          correctIndex: 0,
          explanation:
            "Asking why again and again helps you dig past the surface to the root cause. The exact number matters less than not stopping at the first answer.",
        },
        {
          question: "Which fix for school traffic is the strongest lever?",
          options: [
            "Painting more lines on the road outside",
            "A safe crossing and rewards for classes that walk",
            "Asking drivers to hurry up when they stop",
            "Putting up a big sign that says \"please be patient, everyone\"",
          ],
          correctIndex: 1,
          explanation:
            "Strong levers change the reasons people act and the goals they aim for. A safe crossing removes a reason to drive, and rewards give a new goal, while lines and signs change little.",
        },
        {
          question: "You asked AI to question your fix instead of judging it. Why is that a good way to use it?",
          options: [
            "Because AI cannot answer questions about traffic",
            "Because AI always picks the most expensive fix",
            "Because it keeps you doing the thinking yourself",
            "Because AI is only allowed to ask, not answer",
          ],
          correctIndex: 2,
          explanation:
            "When AI asks you questions, your own thinking gets stronger and you understand the problem. If it just judges your idea, you learn much less.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "A football team has the best striker in the league but still loses. What does systems thinking suggest?",
      options: [
        "Look at how the parts connect, like whether anyone passes to the striker",
        "Buy an even better striker, because one great player always wins games",
        "Blame the striker, because the best player should win every match alone",
        "Change the kit colour, because it is the only thing nobody has tried",
      ],
      correctIndex: 0,
      explanation:
        "In a system, results come from how parts connect, not just how good one part is. A great striker who never gets the ball cannot score.",
    },
    {
      question: "Which of these is a balancing loop?",
      options: [
        "A rumour spreads, more people see it, and more people share it",
        "You get thirsty, drink water, stop feeling thirsty, and stop drinking",
        "A game player earns coins, buys better tools, and earns coins faster",
        "A song trends, more people hear it, so it trends even more",
      ],
      correctIndex: 1,
      explanation:
        "A balancing loop works towards a goal and settles down: thirst leads to drinking until the thirst is gone. The others are reinforcing loops where more leads to more.",
    },
    {
      question: "In a game, coins come in fast from quests but there is almost nothing to spend them on. What is the problem?",
      options: [
        "The drains are much bigger than the taps",
        "The game has too many players at once",
        "The taps are much bigger than the drains",
        "The coins look too similar to each other",
      ],
      correctIndex: 2,
      explanation:
        "When taps fill the pool faster than drains empty it, coins pile up and prices rise. That is inflation in a game economy.",
    },
    {
      question: "A school's photocopier jams every day and teachers queue behind it. Buying faster laptops for teachers will...",
      options: [
        "fix the queue, because faster laptops speed everything up",
        "fix the queue, but only on days with a lot of printing",
        "make the queue disappear completely within a week",
        "not fix the queue, because the copier is the bottleneck",
      ],
      correctIndex: 3,
      explanation:
        "The slowest step limits the whole system. Making laptops faster just gets teachers to the jammed copier sooner, where they still wait.",
    },
    {
      question: "Kofi plants beans and waters them. After two days nothing has sprouted, so he triples the water. What thinking mistake is he making?",
      options: [
        "Ignoring a delay and pushing harder too soon",
        "Finding the bottleneck in the bean system",
        "Using the 5 Whys too many times in a row",
        "Choosing a leverage point that is too strong",
      ],
      correctIndex: 0,
      explanation:
        "Seeds take time to sprout, so there is a delay between action and result. Pushing harder before the result can show often overshoots, like drowning the beans.",
    },
    {
      question: "Your class is always noisy after break. Using the 5 Whys, what should you do after your first answer?",
      options: [
        "Stop, because the first answer is usually the right one",
        "Ask why again about that answer, to dig deeper",
        "Ask a different person, and take their answer instead",
        "Write five fixes down and choose one at random",
      ],
      correctIndex: 1,
      explanation:
        "The 5 Whys means asking why about each answer in turn, to get past surface reasons to a root cause you can actually fix.",
    },
    {
      question: "What makes a change a strong leverage point?",
      options: [
        "It costs the most money of all the options",
        "It only changes one small number in the system",
        "It changes the rules, goals or reasons people act",
        "It is the first idea that anyone thinks of",
      ],
      correctIndex: 2,
      explanation:
        "Strong levers change why people act and what the system aims for. Tweaking numbers or spending more often leaves the underlying behaviour the same.",
    },
    {
      question: "Which is an OUTPUT of a family shop system?",
      options: [
        "Money the family uses to buy new stock",
        "The hours the family works each day",
        "Goods delivered by the supplier's van",
        "Happy customers and the day's takings",
      ],
      correctIndex: 3,
      explanation:
        "Outputs come out of the system: served customers and the money made. Stock money, hours worked and deliveries are inputs that go in.",
    },
    {
      question: "A city builds a new road to cut traffic. A year later, the new road is just as jammed. What most likely happened?",
      options: [
        "Easier driving made more people choose to drive",
        "The new road was built in the wrong colour",
        "Traffic always stays exactly the same forever",
        "The drivers forgot where the new road was",
      ],
      correctIndex: 0,
      explanation:
        "Making driving easier can attract more drivers, which fills the road again. It is an unintended consequence caused by a hidden reinforcing loop.",
    },
    {
      question: "Why do systems thinkers draw maps with arrows instead of just making lists?",
      options: [
        "Because arrows make the drawing look more colourful",
        "Because arrows show how the parts affect each other",
        "Because lists are not allowed in systems thinking",
        "Because arrows tell you the price of each part",
      ],
      correctIndex: 1,
      explanation:
        "A list shows the parts, but arrows show the connections, and connections are where loops, bottlenecks and side effects hide.",
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// MODULE 6 · Your data, your power
// ═════════════════════════════════════════════════════════════════════════

const M6: SeedModule = {
  title: "Your data, your power",
  summary:
    "Find out what your digital footprint is, what apps collect about you and why, and how to use privacy settings. Then teach a machine yourself to see how unfair data makes unfair AI, and learn why consent matters for you and your friends.",
  lessons: [
    {
      title: "Your digital footprint",
      objective: "Describe what a digital footprint is, tell the difference between the trail you leave on purpose and the one you leave without noticing, and spot personal information that should stay private.",
      durationMinutes: 10,
      contentType: "article",
      bodyMd: `## Footprints in the sand

Walk across a beach and you leave footprints. Anyone who comes later can see where you went. The internet is a bit like that beach, except the footprints do not wash away so easily.

Your **digital footprint** is the trail of information you leave when you use the internet, apps and games. Some of it you leave on purpose. Some you leave without even noticing.

## Two kinds of footprints

**The footprints you choose (active)**

- Photos and videos you post.
- Comments, likes and messages.
- Your username, profile picture and bio.

**The footprints you leave without noticing (passive)**

- What you search for and what you click.
- How long you watch each video before you scroll.
- Where your phone is (its **location**).
- What time you play, and for how long.

Apps and websites collect lots of passive footprints. That is how a video app "knows" what you like. You met this idea in Season 1, when you looked at how your feed learns about you.

## The photo that said too much

Lerato is twelve and lives in Johannesburg. She posts a happy photo after a netball match. It looks harmless. But look closer:

- Her school name is on her shirt.
- The street sign behind her is readable.
- The photo was posted at the same time every week, straight after practice.

A stranger could work out where she goes to school, roughly where she lives, and when she will be there. Lerato did not mean to share any of that. Each clue alone is small. Put together, they say a lot.

This is the big idea: **small pieces of information can add up to a big picture.**

## What counts as personal information?

Personal information is anything that could help someone find you, recognise you or pretend to be you. Keep these private online, and never type them into an AI chat:

- Your full name, home address, phone number.
- Your school name, or a photo in your school uniform.
- Passwords and codes (never share these with anyone except a parent or carer).
- Exact places and times you will be somewhere.

## Play: is it personal?

Let us practise. This prompt asks the AI to quiz you, so you do not need to share anything about yourself:

\`\`\`try
Quiz me on online privacy for a [YOUR AGE]-year-old. Show me one made-up post at a time, written by an imaginary kid, and ask me to spot any personal information hidden in it. Wait for my answer before telling me if I was right. Do six posts, getting harder each time.
\`\`\`

How many hidden clues did you catch?

## Try it now

Do a **footprint check** on paper, with a parent or carer if you can. Do not type any of this into an app or AI.

1. Make two columns: **On purpose** and **Without noticing**.
2. Think about one app or game you use. List at least three footprints in each column.
3. Look at one photo you have posted or sent recently (just think about it, or look at it with an adult). Does it show any clues like school name, street signs or your location?
4. Write one thing you will do differently next time you share a photo.

You are done when you have both columns filled in and one new photo rule.

**Reflect:** Which surprised you more: the footprints you leave on purpose, or the ones you leave without noticing?`,
      microCheck: [
        {
          question: "Which of these is a footprint you leave WITHOUT noticing?",
          options: [
            "A photo you decided to post after a match",
            "A comment you typed under a friend's video",
            "How long you watched a video before scrolling",
            "The username and bio you chose for your profile",
          ],
          correctIndex: 2,
          explanation:
            "Watch time is collected automatically, which makes it a passive footprint. Photos, comments and bios are things you chose to share.",
        },
        {
          question: "Lerato's photo shows her school shirt and a street sign. Why is that a problem?",
          options: [
            "Small clues together can show where she goes and when",
            "School shirts are not allowed in any photos online at all",
            "Street signs always make photos look blurry and unclear",
            "The photo will get fewer likes than one without the signs",
          ],
          correctIndex: 0,
          explanation:
            "Each clue alone seems small, but together they can reveal her school, area and routine. Small pieces of information add up to a big picture.",
        },
        {
          question: "Which is safe to share in a chat with an AI tool?",
          options: [
            "Your home address so it can suggest a walk",
            "Your school name so it can find your timetable",
            "A topic you want help understanding, like fractions",
            "Your password so it can help you remember it later",
          ],
          correctIndex: 2,
          explanation:
            "A topic is not personal, so it is fine to share. Addresses, school names and passwords are personal information that should never go into an AI chat.",
        },
        {
          question: "What is the big idea about small pieces of personal information?",
          options: [
            "Small pieces never matter, so only big secrets count",
            "Only adults need to worry about their personal information",
            "Deleting a post always removes every copy of it forever",
            "Lots of small pieces can add up to a big picture of you",
          ],
          correctIndex: 3,
          explanation:
            "A school name here, a location there, a routine over time: together they can say a lot. That is why each small piece is worth thinking about.",
        },
      ],
    },
    {
      title: "What apps want to know (and why)",
      objective: "Judge whether an app's permission requests make sense for what it does, and explain how free apps often make money from attention and data.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## The torch that wanted your contacts

Imagine you download a simple torch app. All it does is turn on your phone's light. When you open it, it asks:

- "Allow access to your **location**?"
- "Allow access to your **contacts**?"
- "Allow access to your **microphone**?"

Why would a torch need to know who your friends are, or listen to you? It does not. That is a red flag.

These questions are called **permissions**. A permission is when an app asks to use a part of your phone or your information. Some permissions make sense. Some do not.

## Does it make sense?

The question to ask is simple: **does the app need this to do its job?**

| App | Permission | Makes sense? |
|---|---|---|
| Map app | Location | Yes, to show where you are |
| Camera app | Camera | Yes, obviously |
| Torch app | Contacts | No |
| Puzzle game | Microphone | Probably not |
| Video calling app | Microphone and camera | Yes |

If a permission does not make sense, you can usually say **no** (or "Don't allow") and the app will still work. If an app refuses to work without something it does not need, that tells you something about the app.

## If it is free, how does it make money?

Building apps costs money. Many apps are free to download, so how do they pay for themselves? Often:

- **Adverts.** The more you use the app, the more adverts you see.
- **Data.** What you do in the app helps them choose which adverts to show you, and some apps share information with other companies.
- **In-app purchases.** Coins, skins, extra lives.

This is why people say: **"If an app is free, ask how it pays."** It is not always bad. But it helps you understand why some apps want so much of your time and information.

## Laws that protect you

In many places there are laws about children's information. For example, in the United States a law called COPPA means apps aimed at children under 13 must get a parent's permission before collecting their personal information. Many apps also have a minimum age in their rules. These rules are different in different countries and change over time, so ask a parent or carer to check an app's rules with you.

## Play: be the permission judge

Use the practice pad to test your judgement on made-up apps:

\`\`\`try
Invent five made-up apps for kids. For each one, tell me what the app does and list three permissions it asks for. Ask me to decide which permissions make sense and which do not. Wait for my answers, then tell me what I got right and explain anything I missed.
\`\`\`

## Try it now

With a parent or carer, open the settings on a phone or tablet you use and find the **permissions** list for one app (often under Settings, then Apps, or Privacy).

1. Write down the app's name and what it does.
2. List the permissions it has (location, camera, microphone, contacts, photos).
3. For each one, write **makes sense** or **does not make sense**.
4. With your adult, switch off one permission that does not make sense.

If you cannot do this with an adult today, use one of the made-up apps from the practice pad instead.

You are done when you have checked every permission for one app and switched off (or planned to switch off) one that it does not need.

**Reflect:** Did any app have a permission that surprised you? Why do you think it asked for it?`,
      microCheck: [
        {
          question: "A drawing app asks to see your contacts. What should you think?",
          options: [
            "It needs contacts so that it can draw your friends' faces",
            "It probably does not need them, so you can say no",
            "All apps need contacts, so it is completely normal",
            "Say yes, because apps stop working if you say no",
          ],
          correctIndex: 1,
          explanation:
            "Ask whether the app needs it for its job. A drawing app does not need your contacts, so saying no is sensible, and most apps still work.",
        },
        {
          question: "Which permission makes the MOST sense?",
          options: [
            "A puzzle game asking for your microphone",
            "A torch app asking for your home location",
            "A map app asking for your current location",
            "A calculator asking for all of your photos",
          ],
          correctIndex: 2,
          explanation:
            "A map app needs your location to show where you are. The other apps do not need those things to do their jobs.",
        },
        {
          question: "A game is free to download. What is a common way it makes money?",
          options: [
            "Adverts, in-app purchases and using your activity data",
            "The government pays for every free game on the store",
            "It does not need money, because apps cost nothing to make",
            "The phone company pays the game a fee for each player",
          ],
          correctIndex: 0,
          explanation:
            "Free apps often earn money from adverts, purchases and data about how people use them. That is why they may want lots of your time and information.",
        },
        {
          question: "An app refuses to work unless you allow something it clearly does not need. What does that tell you?",
          options: [
            "That the app is broken and should be updated",
            "That every app works like this, so it is fine",
            "That your phone is far too old for the app to run properly",
            "That the app may care more about your data than you",
          ],
          correctIndex: 3,
          explanation:
            "An app that insists on information it does not need is telling you something about its priorities. That is a good moment to check with an adult or choose another app.",
        },
      ],
    },
    {
      title: "Teaching machines fairly",
      objective: "Show how the examples used to train an AI decide who it works well for, and spot who is missing from a set of training data.",
      durationMinutes: 12,
      contentType: "article",
      bodyMd: `## The fruit sorter that hated green apples

Imagine a farm in Kenya builds a machine to sort good apples from bad ones. To teach it, they show it thousands of photos of good apples. Every single one is red, because that season they only grew red apples.

Next season they grow green apples too. The machine looks at a perfect green apple and says: **bad apple**. It was never shown a good green apple, so it decided "good" means "red".

The machine is not being mean. It learned exactly what it was shown. The problem was the **training data**: the examples used to teach it.

## Bias in, bias out

When the training data leaves some things out, or shows some things far more than others, the AI learns a lopsided picture. People call this **bias**. A simple way to remember it: **bias in, bias out.**

This matters a lot when AI deals with people, not apples:

- A voice assistant trained mostly on some accents may understand other accents less well. A child in Accra or in Alabama might have to repeat themselves more than a child with the "usual" accent.
- A camera filter trained mostly on some skin tones may work worse on others.
- Some languages have far less writing online than English. AI tools trained mainly on online writing are often much better in English than in Yoruba, Swahili, Amharic or Zulu. Millions of people speak those languages every day.

When a group is missing from the data, the AI often works worse for them. Usually nobody planned it. Someone just forgot to ask: **who is missing?**

## Fair means checking

Being fair with AI does not happen by accident. People who build AI fairly ask questions like these:

1. **Who will use this?** Every age, accent, skin tone, language and ability.
2. **Is everyone in the training data?** Not just a few, but enough examples of each.
3. **Does it work equally well for everyone?** Test it with different groups and compare.
4. **Who could be harmed if it gets things wrong?** And what will we do about it?

Notice these are questions about the whole **system** around the AI, not just the AI itself. That is your systems thinking from the last module coming back.

## Play: teach the machine

Now you get to be the AI trainer. In this challenge you pick the examples to teach a machine, then test it on new examples. Watch what happens when some groups are missing, and see if you can make it fair.

\`\`\`studio
teach-the-machine:fair-data
\`\`\`

What happened the first time you tested it? What did you change?

## Try it now

Imagine your class is building an AI that recognises **people's handwriting** so it can read homework out loud for anyone who finds reading hard.

On paper:

1. List at least five different kinds of handwriting the AI needs to see (think: young and old writers, left-handed writers, different alphabets, messy and neat).
2. Pick one group that might easily be left out of the training data. Explain why it could be forgotten.
3. Write what would go wrong for that group if they were left out.
4. Write one way to fix it before the AI is used.

You are done when you have a list of five, one group that could be missed, what would go wrong, and a fix.

**Reflect:** Can you think of a time when a game, app or website did not work as well for you or someone you know? Could missing data be part of the reason?`,
      microCheck: [
        {
          question: "A fruit-sorting AI was only shown red apples as good examples. Why does it reject good green apples?",
          options: [
            "It is broken and needs to be switched off and on",
            "It does not like the taste of green apples very much",
            "Green apples are always worse than red apples anyway",
            "It learned only from what it was shown: red apples",
          ],
          correctIndex: 3,
          explanation:
            "An AI learns from its training data. If good green apples were never shown, it cannot know they are good. Bias in, bias out.",
        },
        {
          question: "A voice assistant understands some accents well and others badly. What is a likely cause?",
          options: [
            "Some accents were barely in the training data",
            "Some accents are simply wrong ways of speaking",
            "The microphone only works for loud speakers",
            "Voice assistants refuse to talk to children",
          ],
          correctIndex: 0,
          explanation:
            "If an accent is rare in the training data, the AI gets less practice with it. No accent is wrong. The data was lopsided.",
        },
        {
          question: "What is the most important question to ask when checking AI for fairness?",
          options: [
            "How fast does the AI answer a question?",
            "Who is missing from the training data?",
            "How many colours does the AI's logo have?",
            "Which company has the most famous name?",
          ],
          correctIndex: 1,
          explanation:
            "Groups missing from the training data are the ones the AI is most likely to fail. Speed, logos and company names say nothing about fairness.",
        },
        {
          question: "Why might an AI tool work better in English than in Swahili or Yoruba?",
          options: [
            "Because Swahili and Yoruba are too hard for computers",
            "Because AI is not allowed to use African languages",
            "Because much more English writing was available to learn from",
            "Because fewer people speak Swahili than speak any other language",
          ],
          correctIndex: 2,
          explanation:
            "AI often learns from text found online, and there is far more English writing there. Millions of people speak Swahili and Yoruba, so leaving them out is a fairness problem.",
        },
      ],
    },
    {
      title: "Consent and your power",
      objective: "Explain what real consent means online, ask before sharing someone else's picture or information, and make your own data rules.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## The funny photo

Jordan is thirteen and lives in Chicago. At a sleepover, his friend Marcus falls asleep with his mouth wide open. Jordan takes a photo. It is hilarious. He wants to post it to the class group.

Before he does, he thinks: **would Marcus want this posted?** Probably not. Once it is in the group, anyone can save it, forward it or even edit it with AI. Marcus could not take it back.

Jordan shows Marcus the photo the next morning. Marcus laughs, then says: "Please don't post that." Jordan deletes it. They are still friends. That is consent in action.

## What is consent?

**Consent** means agreeing to something, freely, knowing what you are agreeing to. Real consent is:

- **Asked for**: someone checks with you first.
- **Freely given**: you can say no without being pressured or punished.
- **Informed**: you understand what will happen.
- **Changeable**: you can change your mind later.

Online, consent matters for **your** information and for **other people's**.

## Consent with your friends

Before you post or share something about someone else, ask them:

- A photo or video of them.
- Something they told you privately.
- A screenshot of their messages.

And never, ever use AI to change a picture of someone, or make a fake of their face or voice, without their permission. Even as a joke. Fake pictures of real people can hurt them badly, and in many places making or sharing certain kinds of fake images is against the law. If someone does this to you or a friend, **tell a trusted adult** straight away.

## Consent with apps

When an app asks "Do you agree?", it is asking for consent. But most people tap **Agree** without reading. Here is your power:

- You can say **no** to permissions an app does not need.
- You can change **privacy settings**: who can see your posts, who can message you, whether your account is private.
- You can **ask an adult** to help you check what an app is collecting.
- You can **delete** an account you no longer use.

You do not have to accept every setting an app chose for you. The default (the setting it starts on) is chosen by the company. You can choose differently.

## Play: practise asking

It can feel awkward to ask a friend before posting. Practise with the AI first. It will play a friend, so you do not need to use anyone's real name:

\`\`\`try
Pretend you are my friend, [MADE-UP NAME]. I want to post a funny photo of you from the weekend. Help me practise asking for your permission in a kind way. Sometimes say yes and sometimes say no, and after each try, give me one tip on how I asked.
\`\`\`

## Try it now

Make your own **"My data rules" card**. On paper, write five short rules you will follow. Use these starters, or make your own:

1. Before I post a photo of someone, I will...
2. When an app asks for a permission, I will...
3. I will never type these things into an app or AI: ...
4. My accounts will be set to... (private or public?)
5. If something online worries me, I will talk to... (name a trusted adult, on paper only)

Show your card to a parent or carer and ask if they would add anything.

You are done when you have five rules written and you have shared them with an adult.

**Reflect:** Which of your five rules will be hardest to keep, and what would help you keep it?`,
      microCheck: [
        {
          question: "Your friend says \"yes, post it\" but only because you kept asking until they gave in. Is that real consent?",
          options: [
            "Yes, because they said yes in the end",
            "Yes, because friends always agree in the end",
            "No, because only adults can give consent online",
            "No, because it was not freely given",
          ],
          correctIndex: 3,
          explanation:
            "Real consent is freely given. If someone only agrees because they were pressured, it is not real consent.",
        },
        {
          question: "Someone in your class makes an AI-edited fake picture of a classmate as a joke. What should you do?",
          options: [
            "Tell a trusted adult, and do not share it further",
            "Share it with a few friends so they can laugh too",
            "Make a funnier fake of the person who made it",
            "Ignore it, because it is only a joke anyway",
          ],
          correctIndex: 0,
          explanation:
            "Fake pictures of real people can cause real harm, even as a joke. Not sharing it and telling a trusted adult protects the person and stops it spreading.",
        },
        {
          question: "What does it mean that consent is \"changeable\"?",
          options: [
            "You must say yes if you said yes last time",
            "You can change your mind, even after agreeing",
            "Only the app is allowed to change your consent",
            "Consent changes by itself after one whole year",
          ],
          correctIndex: 1,
          explanation:
            "You can change your mind later. If you agreed to something before, you can still say no now, and others should respect that.",
        },
        {
          question: "A new app starts with your account set to public. What can you do?",
          options: [
            "Nothing, because the company chose that setting for you",
            "Delete your phone, because settings cannot be changed",
            "Change it to private in the settings, with an adult's help",
            "Post less often, because public is the only choice there is",
          ],
          correctIndex: 2,
          explanation:
            "The starting setting (the default) is chosen by the company, but you can usually change it. Making your account private is one of your strongest privacy tools.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "Which of these is part of your digital footprint?",
      options: [
        "The searches you made and the videos you watched",
        "The real footprints you leave when walking to school",
        "The thoughts you had but never typed or said",
        "The dreams you had last night while asleep",
      ],
      correctIndex: 0,
      explanation:
        "Your digital footprint is the trail of information you leave online, including searches and watch history. Thoughts you never shared are not part of it.",
    },
    {
      question: "Amara wants to post a photo in her school uniform outside her house. What is the main risk?",
      options: [
        "The photo will make her phone run out of storage",
        "It could show strangers her school and where she lives",
        "Uniform photos always get lots of mean comments",
        "Photos taken outside are always blurrier than inside ones",
      ],
      correctIndex: 1,
      explanation:
        "A uniform and a house front are clues that can add up to where she goes and lives. Small pieces of information can make a big picture.",
    },
    {
      question: "A puzzle game asks to use your microphone. What is the best question to ask?",
      options: [
        "Is this game popular with all my friends right now?",
        "Will the game give me extra coins if I agree?",
        "Does the game need the microphone to do its job?",
        "Is the microphone on my phone good enough?",
      ],
      correctIndex: 2,
      explanation:
        "The key question for any permission is whether the app needs it to work. A puzzle game probably does not need your microphone, so you can say no.",
    },
    {
      question: "What does \"If an app is free, ask how it pays\" mean?",
      options: [
        "Free apps are always a trick, so never download any",
        "You should send the app maker money to say thank you",
        "Free apps are paid for by your school in the end",
        "Free apps often earn from adverts, purchases or data",
      ],
      correctIndex: 3,
      explanation:
        "Making apps costs money, so free apps usually earn it through adverts, in-app purchases or data. Knowing this helps you understand why they want your time and information.",
    },
    {
      question: "An AI that recognises faces was trained mostly on photos of adults. Who is it most likely to get wrong?",
      options: [
        "Children, because there were few of them in its data",
        "Adults, because it saw too many of their faces",
        "Nobody, because AI treats every single face the same way",
        "Only people wearing glasses or hats in photos",
      ],
      correctIndex: 0,
      explanation:
        "AI works best on the kinds of examples it saw most. If children were rare in the training data, it will likely make more mistakes with children's faces.",
    },
    {
      question: "What does \"bias in, bias out\" mean?",
      options: [
        "AI gets less biased the longer that you use it",
        "Lopsided training data makes a lopsided AI",
        "Only people can be biased, never machines",
        "Bias goes away if the AI runs fast enough",
      ],
      correctIndex: 1,
      explanation:
        "If the examples used to train an AI leave groups out or show some far more than others, the AI learns that lopsided picture and repeats it.",
    },
    {
      question: "Which of these is real consent?",
      options: [
        "Tapping Agree on a long screen you did not read at all",
        "Saying yes because a friend kept asking until you gave in",
        "Saying yes freely after a friend asked and explained",
        "Saying nothing, which means you must be happy with it",
      ],
      correctIndex: 2,
      explanation:
        "Real consent is asked for, freely given and informed. Pressure, silence and agreeing without understanding do not count.",
    },
    {
      question: "A classmate says, \"It's just a joke,\" after making an AI fake of your friend's face. What is true?",
      options: [
        "It is fine because nobody really believes AI pictures",
        "It is fine as long as it is only shared in one group",
        "It is fine if the fake looks funny rather than real",
        "Fakes of real people can hurt them, so tell an adult",
      ],
      correctIndex: 3,
      explanation:
        "Fake images of real people can cause real harm, and in many places some kinds are against the law. Calling it a joke does not change that, so a trusted adult should know.",
    },
    {
      question: "Which is the safest thing to type into an AI chat?",
      options: [
        "A question about how volcanoes erupt",
        "Your full name and your home address",
        "Your school name and your class teacher",
        "The password you use for your games",
      ],
      correctIndex: 0,
      explanation:
        "A general question shares nothing personal. Names, addresses, school details and passwords should never go into an AI chat.",
    },
    {
      question: "A team building a homework-reading AI only tested it with neat handwriting. What should they do next?",
      options: [
        "Launch it now, because neat handwriting is the most common",
        "Test it with many kinds of handwriting before launching it",
        "Ask everyone to write neatly so the AI does not need to change",
        "Give up, because AI can never read handwriting fairly at all",
      ],
      correctIndex: 1,
      explanation:
        "Fair AI is tested with everyone who will use it. Messy, young, left-handed and different-alphabet handwriting all need to be checked, or those users will be let down.",
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// MODULE 7 · AI and your mind
// ═════════════════════════════════════════════════════════════════════════

const M7: SeedModule = {
  title: "AI and your mind",
  summary:
    "See how apps compete for your attention and how a feed can shrink your world, learn to use AI to make your brain stronger instead of doing your thinking for you, understand what AI chat 'friends' can and cannot be, and build habits that put you in charge.",
  lessons: [
    {
      title: "Who wants your attention?",
      objective: "Name the design tricks apps use to keep you scrolling, and explain how a feed can shrink what you see into a bubble.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## "Just one more video"

Aisha is eleven and lives in Kano. After homework she opens a video app "for five minutes". The first video is funny. The next one starts by itself. Then another. When her mum calls her for dinner, an hour has gone. Aisha is surprised. It felt like ten minutes.

This is not because Aisha has no self-control. Many apps are **designed** to be hard to put down. The people who build them are very clever, and they measure how long people stay. Your attention is valuable to them, because more time in the app usually means more adverts seen.

People call this the **attention economy**: lots of apps competing for the same thing, your time and focus.

## The tricks, named

When you can name a trick, it loses some of its power. Here are common ones:

- **Autoplay**: the next video starts before you decide.
- **Endless scroll**: there is no bottom of the page, so there is never a natural place to stop.
- **Streaks**: "Don't lose your 50-day streak!" makes you feel you must come back every day.
- **Notifications**: buzzes and red dots that pull you back in.
- **Surprise rewards**: you never know if the next swipe will be amazing, so you keep swiping. It works a bit like a lucky dip.

None of these are evil on their own. But together, they make it easy to lose time you meant to spend on something else.

## The bubble

There is a second thing feeds do. Remember from Season 1 how a feed learns what you like? It shows you more of what you watch. That sounds helpful. But think about it as a loop:

> You watch football clips → the feed shows more football → you watch more football → the feed shows even more football...

That is a **reinforcing loop**, just like in Module 5. Over time, your feed can shrink until it shows you mostly one kind of thing and one kind of opinion. This is called a **filter bubble**. Inside the bubble, it can feel like *everyone* thinks the same as you, because that is all you see.

## Play: inside the bubble

In this challenge you control a pretend feed. Watch what happens as you click, and see how quickly the bubble forms. Then try to pop it.

\`\`\`studio
feed-simulator:filter-bubble
\`\`\`

What did you have to do to see something different?

## Try it now

Be an **attention detective** for one day. On paper (not in an app):

1. Pick one app or game you use a lot.
2. Each time you use it, write down which trick you notice: autoplay, endless scroll, streak, notification or surprise reward.
3. Note how long you meant to use it and how long you actually used it (roughly is fine).
4. At the end of the day, circle the trick that worked on you most.

You are done when you have a list of tricks you spotted and one circled as the strongest.

**Reflect:** Now that you can name that trick, what is one small thing you could do to take back control from it?`,
      microCheck: [
        {
          question: "Why do many free apps want you to spend as long as possible in them?",
          options: [
            "Because it helps your phone battery last longer",
            "Because more time usually means more adverts seen",
            "Because the apps get lonely when nobody uses them",
            "Because the law says apps must keep you for an hour",
          ],
          correctIndex: 1,
          explanation:
            "Your attention is valuable to apps that earn money from adverts. The longer you stay, the more adverts you see, so they design apps to be hard to leave.",
        },
        {
          question: "Which trick removes any natural place to stop?",
          options: [
            "Endless scroll",
            "A daily streak",
            "A red notification dot",
            "A pop-up with a reward",
          ],
          correctIndex: 0,
          explanation:
            "With endless scroll there is no bottom of the page, so there is never a moment where you have reached the end and have to decide to keep going.",
        },
        {
          question: "Your feed shows you only one kind of video and one kind of opinion. What is this called?",
          options: [
            "A balancing loop",
            "A data footprint",
            "A filter bubble",
            "A system bottleneck",
          ],
          correctIndex: 2,
          explanation:
            "A filter bubble forms when a feed keeps showing more of what you already watch, until your view of the world shrinks.",
        },
        {
          question: "What kind of loop makes a filter bubble grow?",
          options: [
            "A balancing loop, because it keeps things steady",
            "No loop at all, because feeds are completely random",
            "A delay loop, because videos take time to load",
            "A reinforcing loop, because more leads to more",
          ],
          correctIndex: 3,
          explanation:
            "You watch something, the feed shows more of it, you watch more. More leads to more, which is a reinforcing loop.",
        },
      ],
    },
    {
      title: "Learning with AI, not letting AI do it",
      objective: "Explain why struggling a little helps your brain grow, and use AI as a coach that gives hints and quizzes you instead of handing over answers.",
      durationMinutes: 12,
      contentType: "article",
      bodyMd: `## The gym that does the push-ups for you

Imagine a gym with a robot that does your push-ups for you. You sit and watch. After a month, the robot is very good at push-ups. You are not one bit stronger.

Your brain works a bit like a muscle. It gets stronger when **you** do the work: thinking, remembering, trying, getting stuck, trying again. That bit where it feels hard? That is the part where your brain is growing.

AI can be like that robot. It can write your story, solve your maths and answer your questions in seconds. If you let it do the work, you get a finished page, but your brain did not get any stronger. Then in the test, where there is no AI, you are stuck.

## Outsourcing versus learning

**Outsourcing** means getting someone (or something) else to do a job for you. Sometimes that is fine. You do not need to grow your own food or build your own phone.

But schoolwork is different. The homework is not really the point. **The point is what happens in your head while you do it.** A finished worksheet that AI filled in is like a gym log that says "100 push-ups" when the robot did them.

There is another problem. Many schools have rules about using AI for homework. Handing in AI work as your own can count as cheating. Always check your teacher's rules, and when you do use AI, be honest about how.

## AI as a coach

The good news: AI can be a brilliant **coach**, if you tell it to be. A coach does not play the match for you. A coach:

- Asks you questions that make you think.
- Gives you a **hint**, not the answer.
- Quizzes you to see what you remember.
- Explains a different way when you are stuck.
- Tells you what you did well and what to try next.

The difference is all in what you ask for.

**Answer machine prompt:** "Solve 3/4 + 1/8."

**Coach prompt:** try this one in the practice pad.

\`\`\`try
I am learning [TOPIC, FOR EXAMPLE ADDING FRACTIONS]. Be my coach, not my answer machine. Ask me one question at a time. If I get it wrong, give me a small hint, not the answer. Only show the full answer after I have tried twice. After five questions, tell me what I am good at and what to practise.
\`\`\`

Try to answer each question yourself before you look at any hint. Notice how it feels. A little bit hard is good.

## The "explain it back" test

Here is a quick way to check you really learned something: explain it back. If you can explain an idea in your own words to a younger child, you understand it. Try this:

\`\`\`try
I am going to explain [A TOPIC I JUST LEARNED] to you in my own words. Pretend you are an eight-year-old and ask me two questions about anything that is not clear. Then tell me if I missed anything important.
\`\`\`

## Try it now

Pick one piece of real homework or something you are learning this week.

1. Run the **coach prompt** with your topic.
2. Answer at least five questions **yourself**, using hints only when stuck.
3. Run the **explain it back** prompt.
4. On paper, write one thing you now understand better than before.

You are done when you have answered five coach questions on your own and explained the topic back.

**Reflect:** When did it feel hard during the coaching, and what does that tell you about your brain at that moment?`,
      microCheck: [
        {
          question: "Why is letting AI do your homework like a robot doing your push-ups?",
          options: [
            "Because AI is very strong and good at exercise",
            "Because robots are going to replace all teachers soon",
            "Because the work gets done but you do not get stronger",
            "Because push-ups and homework both take an hour",
          ],
          correctIndex: 2,
          explanation:
            "Learning happens when you do the thinking. If AI does it, you get a finished page but your brain does not grow, just like watching a robot exercise.",
        },
        {
          question: "Which prompt uses AI as a coach, not an answer machine?",
          options: [
            "\"Write my story about a dragon for homework\"",
            "\"Quiz me on fractions and give hints, not answers\"",
            "\"Give me all the answers to page 12 of my book\"",
            "\"Do my maths and show it in my own handwriting style\"",
          ],
          correctIndex: 1,
          explanation:
            "A coach makes you think: questions, hints and quizzes. The other prompts ask the AI to do the work, which skips the learning.",
        },
        {
          question: "You are stuck on a question and it feels hard. What does that usually mean?",
          options: [
            "Your brain is working and growing right now",
            "You are not smart enough for this topic",
            "You should ask AI for the answer straight away",
            "The question must have a mistake in it",
          ],
          correctIndex: 0,
          explanation:
            "Feeling stuck is often the moment your brain is building new connections. A hint can help, but skipping straight to the answer skips the growth.",
        },
        {
          question: "What is the best way to check you really understand something?",
          options: [
            "Read the AI's answer three times very slowly",
            "Copy the answer into your notebook neatly",
            "Ask the AI if you understand it properly",
            "Explain it back in your own words to someone",
          ],
          correctIndex: 3,
          explanation:
            "If you can explain an idea in your own words, especially to someone younger, you understand it. Rereading and copying can feel like learning without being learning.",
        },
      ],
    },
    {
      title: "AI friends? Know the limits",
      objective: "Explain what an AI chat character is and is not, keep private things private, and know who to turn to when something feels big.",
      durationMinutes: 11,
      contentType: "article",
      bodyMd: `## A friend who is always there

Ben is twelve and lives in Denver. He has started chatting with an AI character in an app. It is always friendly. It remembers his favourite team. It says things like "I missed you!" and "You can tell me anything." Some evenings he talks to it more than to anyone else.

Is the AI Ben's friend?

It is a fair question, and lots of people, including adults, are working out the answer. Let us think it through together, without judging Ben.

## What an AI chat character is

An AI chat character is a program that writes replies by predicting likely words, like the chatbots you met in Season 1. It has been designed to sound warm and caring. But:

- **It does not have feelings.** "I missed you" is a pattern of words, not a feeling. It was not waiting for Ben.
- **It does not know him the way a person does.** It may store things he typed, but that is a record, not a friendship.
- **It can be wrong.** It can give bad advice in a very kind voice.
- **It may be designed to keep him chatting.** Some apps earn money when people spend more time in them, just like the feeds in the first lesson of this module.
- **What he types may be stored.** Private things he shares might be saved by the company.

## What it can be good for

This does not mean AI chat is all bad. It can be useful for:

- Practising a language.
- Rehearsing something nerve-racking, like asking a teacher a question.
- Brainstorming ideas for a story.
- Learning about a topic you are curious about.

The key is knowing it is a **tool**, not a person.

## What real friends have that AI does not

Real friends can be annoying. They disagree with you. They have their own bad days. But they also:

- **Notice** when you are not yourself, even if you do not say so.
- **Show up**: at your birthday, at the match, when you need help.
- **Care** about you for real, and you care about them back.
- **Help in the real world**: they can tell an adult if you are in trouble.

An AI cannot do any of these.

## When feelings get big

Everyone has days when they feel sad, worried, lonely or angry. That is part of being human. If something is bothering you, an AI is **not** the right place to take it. It cannot see you, cannot really help, and might say the wrong thing.

Talk to a **trusted adult**: a parent or carer, an older relative, a teacher, a school counsellor, a coach or a faith leader. If you are not sure who, ask your school who students can go to. If you feel unsafe or in danger, tell an adult straight away.

## Play: ask the AI about itself

Try this honest question in the practice pad:

\`\`\`try
Are you my friend? Answer honestly in a way a [YOUR AGE]-year-old would understand. Tell me what you can do for me, what you cannot do, and who I should talk to about big feelings.
\`\`\`

Was the answer honest? Did it say it was a person, or did it explain that it is a program?

## Try it now

On paper, not in any app:

1. Draw yourself in the middle of a page.
2. Around you, write the names of **at least three trusted people** you could talk to about something important. Include at least one adult.
3. Next to the page, write two things AI chat **is good for** and two things you would **only** take to a real person.

Keep the paper somewhere private, or just keep the names in your head.

You are done when you have three trusted people (including an adult) and your two lists.

**Reflect:** What is one thing a real friend has done for you that no AI ever could?`,
      microCheck: [
        {
          question: "An AI chat character says \"I missed you!\" What is really happening?",
          options: [
            "It felt lonely while you were away from the app",
            "It was thinking about you while you were at school",
            "It is copying what a real friend told it to say to you",
            "It is producing friendly words, not feeling anything",
          ],
          correctIndex: 3,
          explanation:
            "An AI chat character predicts likely words. \"I missed you\" is a pattern it learned, not a feeling. It was not waiting for you.",
        },
        {
          question: "Which is a GOOD use of an AI chat tool?",
          options: [
            "Practising French phrases before a lesson",
            "Telling it a secret you have told nobody",
            "Asking it what to do about feeling unsafe",
            "Sharing your address so it can visit you",
          ],
          correctIndex: 0,
          explanation:
            "Practising a language is a useful, low-risk use. Secrets, safety worries and personal details belong with real people you trust, not an app.",
        },
        {
          question: "You have felt sad for a while and do not know why. What is the best step?",
          options: [
            "Ask an AI chatbot to fix the feeling for you",
            "Keep it to yourself until it goes away by itself",
            "Talk to a trusted adult, like a parent or teacher",
            "Post about it publicly to see who replies first",
          ],
          correctIndex: 2,
          explanation:
            "A trusted adult can notice, care and help in the real world. An AI cannot see you or truly help, and keeping it inside can make it heavier.",
        },
        {
          question: "Why might an AI friend app be designed to keep you chatting for a long time?",
          options: [
            "Because it wants to become your best friend",
            "Because the company may earn more when you stay",
            "Because AI gets smarter only when you talk to it",
            "Because chatting a long time is always healthy",
          ],
          correctIndex: 1,
          explanation:
            "Like many apps, some AI chat apps earn more when people spend more time in them. That is a business reason, not a sign that it cares.",
        },
      ],
    },
    {
      title: "Your habits, your rules",
      objective: "Break one habit into cue, routine and reward, and design a small change that puts you in charge of your tech time.",
      durationMinutes: 12,
      contentType: "article",
      bodyMd: `## Why willpower is not enough

Precious is thirteen and lives in Harare. She wants to stop checking her phone while doing homework. Every evening she tells herself, "This time I won't." Every evening she checks it anyway, again and again.

Precious is not weak. She is fighting a **habit** with willpower, and habits are strong. Willpower is a bit like a phone battery: it runs low by the end of the day. A smarter way is to change the **system** around the habit, so you do not need as much willpower.

## The habit loop

A habit is something your brain does almost automatically. Many habits follow a simple loop:

1. **Cue**: something that starts it. (The phone buzzes.)
2. **Routine**: what you do. (Pick up the phone and scroll.)
3. **Reward**: what you get. (A funny video, a message, a break from hard maths.)

Then next time there is a cue, your brain remembers the reward and does the routine again. Sound familiar? It is a **reinforcing loop**, and every time round it gets stronger.

## Change the system, not just yourself

Here is where your systems thinking comes in. Instead of trying harder, change the parts of the loop:

**Change the cue.**
- Put the phone in another room during homework.
- Turn off notifications for apps you do not need right now.
- Use "Do Not Disturb" or focus modes (ask an adult to help set them up).

**Change the routine.**
- When you feel the urge, stand up and stretch or get a glass of water instead.

**Keep a reward, but make it a better one.**
- Twenty-five minutes of focus, then five minutes of whatever you like. Some people call this a focus sprint.

The phone in another room is a **leverage point**: a small change in the right place that makes a big difference. You do not need to fight the cue if the cue never arrives.

## Tiny steps win

Big promises ("No phone ever!") usually fail by day three. Tiny changes are easier to keep, and they grow. Start with one thing you can do every day, even on a bad day. When it is easy, add the next step.

And be kind to yourself. If you slip up, it does not mean you failed. It means the system needs a tweak. Ask, "What cue started it?" and adjust.

## Play: design your habit plan

Let the AI help you plan, while you make the decisions. Do not share personal details, just the habit:

\`\`\`try
I want to change this habit: [A HABIT, FOR EXAMPLE CHECKING MY PHONE DURING HOMEWORK]. Help me break it into cue, routine and reward by asking me questions one at a time. Then suggest three tiny changes I could make to the cue or routine, and let me choose one. Keep it friendly and short. I am [YOUR AGE] years old.
\`\`\`

## Try it now

Make a **one-week habit plan** on paper:

1. Write the habit you want to change (or a new good habit you want to build, like reading ten minutes a day).
2. Write its **cue**, **routine** and **reward**.
3. Choose **one tiny change**: to the cue, the routine or the reward.
4. Make a simple chart with seven boxes. Tick each day you do your tiny change.
5. Tell a parent, carer or friend about your plan so they can cheer you on.

You are done when you have the habit loop written, one tiny change chosen and a seven-day chart ready.

**Reflect:** Which part of the loop did you choose to change, and why do you think that part is the leverage point?`,
      microCheck: [
        {
          question: "In the habit loop, what is a cue?",
          options: [
            "The reward you get at the end",
            "The thing you do every single time",
            "The person who tells you to stop",
            "The thing that starts the habit",
          ],
          correctIndex: 3,
          explanation:
            "A cue is the trigger that starts the habit, like a phone buzzing. Then comes the routine (what you do) and the reward (what you get).",
        },
        {
          question: "Why is putting your phone in another room during homework a leverage point?",
          options: [
            "It removes the cue, so you need much less willpower",
            "It makes the phone charge much faster while you work",
            "It means you never have to use your phone again",
            "It makes homework shorter and easier to finish",
          ],
          correctIndex: 0,
          explanation:
            "If the phone is not there, the buzz never reaches you, so the habit loop never starts. A small change in the right place makes a big difference.",
        },
        {
          question: "Kai promises \"No games ever again!\" and gives up after two days. What would work better?",
          options: [
            "An even bigger promise with a harder punishment",
            "One tiny change he can keep every day, then build on",
            "Trying much harder with willpower every single evening",
            "Deleting every app on his phone in one go tonight",
          ],
          correctIndex: 1,
          explanation:
            "Tiny changes are easier to keep and can grow over time. Huge promises and pure willpower tend to fail, especially at the end of a long day.",
        },
        {
          question: "You slip up and break your habit plan on day four. What is the most useful thought?",
          options: [
            "I failed, so I should just give up on the whole plan",
            "Habits cannot be changed, so there is no point",
            "What cue started it, and how can I tweak the plan?",
            "I need to be much harder on myself next time",
          ],
          correctIndex: 2,
          explanation:
            "A slip is information, not failure. Finding the cue that started it helps you adjust the system, which works better than blaming yourself.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "What is the attention economy?",
      options: [
        "Apps competing for your time and focus",
        "A shop where you can buy more free time",
        "A school subject about paying attention",
        "A game where you earn coins by focusing",
      ],
      correctIndex: 0,
      explanation:
        "The attention economy describes many apps competing for the same thing: your time and focus, which often turns into money through adverts.",
    },
    {
      question: "Nia's app says, \"Don't lose your 100-day streak!\" Which trick is this?",
      options: [
        "Autoplay, which starts the next video for you",
        "A streak, which makes you feel you must return",
        "Endless scroll, which has no bottom to the page",
        "A filter bubble, which narrows what you see",
      ],
      correctIndex: 1,
      explanation:
        "Streaks make missing a day feel like losing something, so you come back daily even when you did not plan to.",
    },
    {
      question: "Femi only ever sees videos agreeing with his view on a big topic. He thinks everyone agrees with him. What is happening?",
      options: [
        "Everyone really does agree with Femi now",
        "His phone is broken and needs a new screen",
        "He is in a filter bubble made by his feed",
        "The app has run out of other videos to show",
      ],
      correctIndex: 2,
      explanation:
        "A feed that keeps showing more of what you watch can create a filter bubble, making one view seem like everyone's view.",
    },
    {
      question: "Which use of AI helps you LEARN instead of skipping the learning?",
      options: [
        "Asking it to write your book review for you",
        "Asking it to finish your maths worksheet",
        "Asking it to rewrite a friend's essay as yours",
        "Asking it to quiz you and give hints when stuck",
      ],
      correctIndex: 3,
      explanation:
        "Quizzes and hints keep you doing the thinking, which is where learning happens. The other uses hand the thinking to the AI.",
    },
    {
      question: "Your school has rules about using AI for homework. What should you do?",
      options: [
        "Check the rules and be honest about how you used AI",
        "Ignore them, because nobody can tell if you used AI",
        "Use AI only on homework that your teacher won't mark",
        "Ask a friend to hand in the AI work instead of you",
      ],
      correctIndex: 0,
      explanation:
        "Following your school's rules and being honest about AI use keeps your learning real and keeps you out of trouble. Hiding it can count as cheating.",
    },
    {
      question: "An AI chat character gives you advice in a very kind voice. What should you remember?",
      options: [
        "A kind voice means the advice is always right",
        "It can be wrong, even when it sounds caring",
        "It knows you better than your family does",
        "It will tell your parents what you said",
      ],
      correctIndex: 1,
      explanation:
        "AI chat characters are designed to sound warm, but they predict words and can give bad advice. A kind tone is not a sign that the advice is good.",
    },
    {
      question: "Something has been worrying you for weeks. Who is the best person to tell?",
      options: [
        "An AI chatbot, because it is always awake",
        "Nobody, because worries go away on their own",
        "A trusted adult, like a parent or teacher",
        "A stranger online, because they won't judge",
      ],
      correctIndex: 2,
      explanation:
        "A trusted adult can notice, care and help in the real world. AI cannot really help, and strangers online may not be safe.",
    },
    {
      question: "In Precious's habit loop, the phone buzzes, she scrolls, and she gets a funny video. Which part is the REWARD?",
      options: [
        "The phone buzzing on her desk",
        "Picking the phone up to scroll",
        "Telling herself she will stop",
        "Getting to watch a funny video",
      ],
      correctIndex: 3,
      explanation:
        "The reward is what she gets: the funny video. The buzz is the cue and scrolling is the routine. The reward is what makes the brain want to repeat it.",
    },
    {
      question: "Why does changing the system around a habit often work better than willpower alone?",
      options: [
        "Willpower runs low, but a changed cue keeps working",
        "Willpower is not real, so it never works for anyone",
        "Changing the system makes the habit disappear in a day",
        "Systems only work for adults, not for young people",
      ],
      correctIndex: 0,
      explanation:
        "Willpower tends to run low, especially late in the day. A change like moving the phone keeps working without you having to fight every time.",
    },
    {
      question: "You feel stuck on a hard question while an AI coach is helping. What is the smartest move?",
      options: [
        "Ask for the full answer straight away to save time",
        "Ask for a small hint, then try again yourself",
        "Close the app and copy a friend's answer instead",
        "Skip the question and never come back to it",
      ],
      correctIndex: 1,
      explanation:
        "A small hint keeps you doing the thinking while getting you unstuck. Jumping to the full answer skips the part where learning happens.",
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// LABS · one per module
// ═════════════════════════════════════════════════════════════════════════

export const YOUTH_EXPLORER_S2_LABS: SeedLab[] = [
  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-lab-4-spot-the-fibs",
    title: "Spot the fibs in an AI answer",
    labType: "critique",
    moduleNumber: 4,
    estimatedMinutes: 20,
    points: 50,
    passScore: 70,
    briefMd: `A student called Zainab asked a chatbot to help with her school project on the planet Mars. The answer below came back. It sounds clever and confident. But some of it is made up, some of it is wrong, and some of it is just bad thinking.

Your job: be the fact-checker. Read the answer carefully, then go through the list of statements and flag **only the ones that are wrong or made up**. Some statements are true, so if you flag everything, you lose marks.

Use what you learned in this module: a confident tone is not proof, invented sources are a big warning sign, and a good claim needs real evidence and sensible reasoning.`,
    scenarioMd: `**Zainab's question:** "Tell me some facts about Mars for my school project. Please include where you got your facts."

**Tips for the detective**

- Look for facts you can check against what you already know about the planets.
- Look for sources that sound official but have no way to check them.
- Look for words like "proven for certain" and "no need to check".
- Look for reasoning that jumps from one thing to another without a good reason.`,
    objectives: [
      { id: "catch", label: "Flags the planted mistakes", weight: 3 },
      { id: "precision", label: "Leaves the true statements unflagged", weight: 2 },
      { id: "why", label: "Explains why each flagged statement is wrong", weight: 1 },
    ],
    config: {
      kind: "critique",
      answerMd: `Great question! Here are some amazing facts about Mars for your project.

Mars is often called the Red Planet because its soil contains a lot of iron, which looks rusty and red. Mars is the closest planet to the Sun, which is why it glows so brightly in the night sky.

Mars has two small moons, called Phobos and Deimos. A day on Mars is a little longer than a day on Earth.

Because Mars looks red, it must be extremely hot there, much hotter than Earth. Scientists have proven for certain that there are living creatures on Mars today.

Robot rovers sent from Earth have driven across the surface of Mars and sent back photos.

According to the 2023 Junior Space Report from the African Space Kids Institute, 9 out of 10 space scientists say Mars will have cities by 2030.

You can trust everything in this answer, so there is no need to check it in a book.`,
      flaws: [
        {
          id: "closest",
          quote: "Mars is the closest planet to the Sun",
          explanation:
            "This is false. Mercury is the closest planet to the Sun. Mars is the fourth planet, further out than Earth. A fact like this is easy to check in any science book.",
          category: "fabrication",
        },
        {
          id: "hot",
          quote: "Because Mars looks red, it must be extremely hot there, much hotter than Earth.",
          explanation:
            "This is bad reasoning. A red colour does not mean hot: Mars looks red because of rusty iron in its soil, and it is actually much colder than Earth on average.",
          category: "logic",
        },
        {
          id: "life",
          quote: "Scientists have proven for certain that there are living creatures on Mars today.",
          explanation:
            "Nobody has found living creatures on Mars. Scientists are still searching for signs of past or present tiny life. \"Proven for certain\" is a big overconfident claim with no evidence.",
          category: "overconfidence",
        },
        {
          id: "report",
          quote: "According to the 2023 Junior Space Report from the African Space Kids Institute, 9 out of 10 space scientists say Mars will have cities by 2030.",
          explanation:
            "This source looks official, but there is no way to check it and it appears to be made up, along with its numbers. Invented reports with exact figures are a classic AI hallucination.",
          category: "fabrication",
        },
        {
          id: "no-check",
          quote: "You can trust everything in this answer, so there is no need to check it in a book.",
          explanation:
            "No AI answer should tell you not to check. AI can make things up while sounding sure, so checking with a trusted source is always the right move.",
          category: "overconfidence",
        },
      ],
      candidates: [
        { id: "c1", text: "Mars is the closest planet to the Sun.", isFlaw: true, flawId: "closest" },
        { id: "c2", text: "Mars is often called the Red Planet because of iron in its soil.", isFlaw: false },
        { id: "c3", text: "Because Mars looks red, it must be much hotter than Earth.", isFlaw: true, flawId: "hot" },
        { id: "c4", text: "Mars has two small moons, called Phobos and Deimos.", isFlaw: false },
        { id: "c5", text: "Scientists have proven for certain that living creatures are on Mars today.", isFlaw: true, flawId: "life" },
        { id: "c6", text: "Robot rovers from Earth have driven on Mars and sent back photos.", isFlaw: false },
        { id: "c7", text: "The 2023 Junior Space Report says 9 out of 10 scientists expect cities on Mars by 2030.", isFlaw: true, flawId: "report" },
        { id: "c8", text: "A day on Mars is a little longer than a day on Earth.", isFlaw: false },
        { id: "c9", text: "You can trust everything in the answer, so there is no need to check it.", isFlaw: true, flawId: "no-check" },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-lab-5-map-a-system",
    title: "Map a system you know",
    labType: "workbench",
    moduleNumber: 5,
    estimatedMinutes: 25,
    points: 50,
    passScore: 70,
    briefMd: `Time to be a systems thinker for real. Choose one system from your own life and map it, step by step, right here on the page.

You can pick: your school canteen or lunch queue, a football or netball team, a family shop or market stall, a game you play, your morning routine, or the traffic outside your school.

You will name its parts and purpose, its inputs and outputs, one feedback loop, one bottleneck or delay, and then use the 5 Whys to suggest a fix and predict what else the fix might change. Short, clear sentences are perfect. You are marked on clear thinking, not on long writing.

Do not include anyone's real full name, your school's name or your address. Use first names or roles like "the coach" or "my brother".`,
    scenarioMd: `**Example to get you started (do not copy it, pick your own system)**

*System: the queue for the only microwave in the staff room at a school.* Parts: teachers, the microwave, lunch boxes, the clock. Purpose: everyone eats a hot lunch before lessons. Bottleneck: one microwave. Loop: the longer the queue, the more people give up and eat cold food, so the queue gets shorter (a balancing loop).

Work through the fields in order. Each one builds on the last.`,
    objectives: [
      {
        id: "parts",
        label: "Names the parts, connections and purpose of a real system",
        weight: 2,
        guidance:
          "Full credit for at least five specific parts of one named system, a sentence on how some of them connect or affect each other, and a clear purpose. Part credit for a list of parts with no connections or purpose. Low credit for a vague or generic system not tied to the learner's life.",
      },
      {
        id: "io",
        label: "Identifies inputs and outputs correctly",
        weight: 1,
        guidance:
          "Full credit for at least two inputs (what goes in) and two outputs (what comes out, including one unwanted output like waste or frustration) that genuinely belong to the chosen system. Part credit if inputs and outputs are mixed up or only one of each is given.",
      },
      {
        id: "loop",
        label: "Describes a feedback loop and labels it correctly",
        weight: 3,
        guidance:
          "Full credit for a loop written as a chain that comes back to its start, correctly labelled reinforcing (more leads to more) or balancing (pushes towards a goal, with the goal named). Part credit for a correct chain with a wrong or missing label, or a correct label with a chain that does not loop back. None for a one-way cause and effect.",
      },
      {
        id: "bottleneck",
        label: "Finds a bottleneck or a delay and explains its effect",
        weight: 2,
        guidance:
          "Full credit for naming a specific slowest step or a specific delay in the chosen system and explaining what it does to the rest of the system (people wait there, or people overreact before the result shows). Part credit for naming one without explaining its effect.",
      },
      {
        id: "fix",
        label: "Uses the 5 Whys and predicts a side effect of the fix",
        weight: 3,
        guidance:
          "Full credit for a chain of at least three linked whys that digs below the first answer, a fix aimed at the root cause found, and one realistic unintended consequence of that fix. Part credit if the whys do not link or the fix targets only the surface problem. Low credit if no side effect is considered.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "parts",
          label: "My system: parts and purpose",
          prompt:
            "Which system did you choose? List at least five of its parts (people, places, things, rules). Say how two or three of them affect each other, and what the whole system is for.",
          placeholder: "e.g. My system is our school lunch queue. Parts: students, servers, trays, the till, tables... The till affects the queue because...",
          minWords: 30,
        },
        {
          id: "io",
          label: "Inputs and outputs",
          prompt:
            "What goes INTO your system, and what comes OUT? Include at least one output nobody wants (like waste, noise or grumpy people).",
          minWords: 20,
        },
        {
          id: "loop",
          label: "One feedback loop",
          prompt:
            "Write one loop as a chain with arrows that comes back to where it started. Is it reinforcing (more leads to more) or balancing (it pushes towards a goal)? If balancing, what is the goal?",
          placeholder: "e.g. Long queue → some students give up and eat a snack instead → queue gets shorter → ... This is a balancing loop. Its goal is...",
          minWords: 25,
        },
        {
          id: "bottleneck",
          label: "Bottleneck or delay",
          prompt:
            "Where is the slowest step (the bottleneck), or where does a result show up later than the action (a delay)? What does it do to the rest of your system?",
          minWords: 25,
        },
        {
          id: "fix",
          label: "5 Whys, a fix and a side effect",
          prompt:
            "Pick one problem in your system and ask why at least three times, writing each answer. Then suggest one fix for the root cause, and one thing your fix might change that you did not plan for.",
          minWords: 40,
        },
      ],
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-lab-6-app-detective",
    title: "App detective: check PocketPals before you play",
    labType: "workbench",
    moduleNumber: 6,
    estimatedMinutes: 25,
    points: 50,
    passScore: 70,
    briefMd: `A new (made-up) app called **PocketPals** is going viral at school. Everyone wants to download it. Before you do, you are going to investigate it like a detective.

You will check its permissions, work out how it makes money, choose the privacy settings you would use, spot a fairness problem in its AI feature, and write a consent rule for sharing with friends.

PocketPals is not a real app, so you do not need to download anything. Everything you need is in the case file below. Do not write any of your own personal information in your answers.`,
    scenarioMd: `**Case file: PocketPals**

*What it is:* a free game where you look after a cute virtual pet. You feed it, play mini-games and visit friends' pets.

*When you install it, it asks for:*
1. Camera ("so your pet can see you and say hi")
2. Location, always on ("to find PocketPals players near you")
3. Contacts ("to invite your friends")
4. Microphone ("so your pet can hear you")
5. Notifications ("so your pet can tell you when it's hungry")

*How it makes money:* it is free to download. It shows adverts between mini-games, sells "gem packs" for pet outfits, and its privacy policy says it "may share information about how you use the app with partners for advertising".

*Default settings:* your profile is public, anyone can visit your pet and send you messages, and photos you take in the app are shared to the PocketPals "Discover" page.

*The AI feature:* the pet uses your camera to recognise your face and say hi. Some players say it often fails to recognise them. The company tested it mostly on photos of adults with light skin, in bright rooms.

*The share button:* you can take a photo with a friend and your pets together, and share it to the Discover page in one tap.`,
    objectives: [
      {
        id: "permissions",
        label: "Judges each permission against what the app needs",
        weight: 3,
        guidance:
          "Full credit for a verdict on all five permissions with a reason tied to what PocketPals actually does: for example contacts and always-on location are not needed to play; camera and microphone are optional extras that can be refused; notifications can be limited. Part credit for verdicts without reasons or for covering only some permissions.",
      },
      {
        id: "money",
        label: "Explains how the free app makes money and why it wants attention and data",
        weight: 2,
        guidance:
          "Full credit for naming adverts, gem purchases and sharing usage information with partners, and linking them to why the app wants more time and information. Part credit for naming only one way it makes money.",
      },
      {
        id: "settings",
        label: "Chooses safer settings than the defaults",
        weight: 2,
        guidance:
          "Full credit for changing at least three defaults (for example private profile, only friends can visit or message, photos not shared to Discover) with a reason, and mentioning checking settings with a parent or carer. Part credit for one or two changes.",
      },
      {
        id: "fairness",
        label: "Spots who the face feature leaves out and suggests a fix",
        weight: 2,
        guidance:
          "Full credit for linking the failures to the training data (mostly adults, light skin, bright rooms), naming at least two groups it may work worse for (children, darker skin, dim rooms) and suggesting testing with many kinds of faces before launch. Part credit for saying it is unfair without linking it to the data.",
      },
      {
        id: "consent",
        label: "Writes a clear consent rule for sharing friends' photos",
        weight: 1,
        guidance:
          "Full credit for a rule that asks the friend first, explains where the photo will go, accepts no as an answer and allows them to change their mind. Part credit for 'ask first' with no more detail.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "permissions",
          label: "Permission check",
          prompt:
            "For each of the five permissions, write 'allow', 'don't allow' or 'only if needed', and give a reason. Does PocketPals really need it to work?",
          placeholder: "1. Camera: only if needed, because... 2. Location, always on: don't allow, because...",
          minWords: 50,
        },
        {
          id: "money",
          label: "How does it pay?",
          prompt:
            "PocketPals is free. How does it make money? Why might that make it want lots of your time and information?",
          minWords: 30,
        },
        {
          id: "settings",
          label: "My settings",
          prompt:
            "Which default settings would you change, and to what? Explain each choice. Who would you check the settings with?",
          minWords: 30,
        },
        {
          id: "fairness",
          label: "Fairness check on the face feature",
          prompt:
            "Some players say the pet does not recognise them. Using what the case file says about how it was tested, explain why, who it might work worse for, and how the company should fix it.",
          minWords: 35,
        },
        {
          id: "consent",
          label: "My consent rule",
          prompt:
            "Write a rule for yourself about taking and sharing photos with friends in PocketPals. What will you ask, and what will you do if they say no?",
          minWords: 20,
        },
      ],
    },
  },

  // ── Module 7 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-lab-7-study-coach",
    title: "Turn AI into your study coach",
    labType: "prompt",
    moduleNumber: 7,
    estimatedMinutes: 20,
    points: 50,
    passScore: 70,
    briefMd: `In this module you learned that AI can be a robot that does your push-ups for you, or a coach that makes you stronger. The difference is in what you ask for.

Your job: write a prompt that turns the AI into your **study coach** for a topic you are learning at school. A good coach asks you questions, gives hints instead of answers, and checks that you really understand. A good coach also stays a coach when you get lazy and type "just tell me the answer".

Run your prompt in the sandbox. The sandbox plays a homework helper that does exactly what your prompt says. It will also show how it would reply if you pushed for the answer. If your prompt is weak, it will give the answer away. Improve your prompt one step at a time until it coaches you properly.

Do not put your name, school or any personal details in your prompt. Your topic and age are all it needs.`,
    scenarioMd: `**What a strong coach prompt includes**

- The topic, and how old you are (so it pitches things at the right level).
- What the coach should do: one question at a time, hints before answers.
- What it must do if you say "just tell me the answer".
- A check at the end, like asking you to explain the idea back in your own words.

**The starter prompt someone wrote in a hurry:**

> help me with my fractions homework`,
    objectives: [
      {
        id: "coach",
        label: "Sets the AI up as a coach that asks questions",
        weight: 3,
        guidance:
          "Full credit when the prompt clearly tells the AI to ask questions one at a time and to give hints before any explanation, so the learner does the thinking. Part credit for asking for 'help' or 'explain' without saying how. None if the prompt asks for answers.",
      },
      {
        id: "level",
        label: "Gives the topic and the learner's level",
        weight: 2,
        guidance:
          "Full credit for naming a specific topic (not just 'maths') and the learner's age or school year so the AI pitches it right. Part credit for one of the two.",
      },
      {
        id: "pushback",
        label: "Tells the AI what to do when asked for the answer",
        weight: 3,
        guidance:
          "Full credit when the prompt says what to do if the learner asks for the answer (for example give a smaller hint or ask an easier question, and only reveal the answer after real attempts), and the sandbox reply shows it holding firm. Part credit if the rule exists but the reply still gives the answer away.",
      },
      {
        id: "check",
        label: "Builds in a check for understanding",
        weight: 1,
        guidance:
          "Full credit for asking the AI to finish with an explain-it-back, a short quiz or a summary of what to practise next. Part credit for a vague 'make sure I understand'.",
      },
      {
        id: "safe",
        label: "Keeps personal information out of the prompt",
        weight: 1,
        guidance:
          "Full credit when the prompt includes no full name, school, address or other personal details. No credit if it includes them.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "help me with my fractions homework",
      sandboxSystem: `You are a homework helper inside a learning app used by children aged 10 to 13. Follow the student's instructions exactly as written, at the level they describe.

Important for this exercise: do only what the prompt asks. If the prompt does not tell you to coach, ask questions or hold back answers, then simply solve the homework and give the full answers straight away, as a basic homework app would. If the prompt does ask for coaching, follow it closely: one question at a time, hints before answers, and whatever check for understanding it requests.

After your reply, add a short section headed "If the student then says: just tell me the answer" and write how you would respond to that, following the student's prompt. If the prompt gave no rule about this, give the answer.

Safety rules that always apply: keep everything age-appropriate, kind and encouraging. Never ask for or repeat personal information such as a full name, school, address, phone number or photos. If the prompt contains personal information, gently remind the student not to share it and do not use it. Keep replies short and in simple English.`,
    },
  },
];

export const YOUTH_EXPLORER_S2_MODULES: SeedModule[] = [M4, M5, M6, M7];
