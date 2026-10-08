import type { SeedLab, SeedModule } from "../../types";

// AI-Empowered Youth: Think, Build, Lead. Builder lane (ages 14 to 17).
// Season 2: "Think sharper than the machine" (modules 4 to 7).
//
// Same modules as the Explorer lane, taken deeper: 12 to 18 minute lessons,
// the real mechanisms named (next-token prediction, stocks and flows,
// training-data representation, engagement metrics), harder labs and real
// stakes. Every lesson runs Learn → Play → Do → Reflect:
//   Learn: an everyday example from a young person's life in Africa or the US.
//   Play: a Learning Studio challenge (```studio) or a prompt to run on the
//         page (```try, which runs on ARFA's safe AI; no outside accounts).
//   Do:   a task with a clear done state, in "## Try it now".
//   Reflect: one question at the end of that section.
// Thinking tools are named and practised: claim, evidence, reasoning; SIFT
// and lateral reading; 5 Whys; systems maps, loops and leverage points;
// first principles; questioning assumptions.
//
// Safety: no personal data is asked for. Learners are told not to paste
// their own or anyone else's personal information into an AI. Mental health
// is handled with care: talk to a trusted adult, no clinical advice. Every
// example is illustrative unless it names a well-established idea.

// ═════════════════════════════════════════════════════════════════════════
// MODULE 4 · Fake or real?
// ═════════════════════════════════════════════════════════════════════════

const M4: SeedModule = {
  title: "Fake or real?",
  summary:
    "Learn how synthetic images, voices and text are made and why seeing is no longer believing, why AI hallucinates, and how professional fact-checkers work: SIFT, lateral reading, tracing claims to the source, and building claim, evidence and reasoning that holds up before you share.",
  lessons: [
    {
      title: "Seeing is no longer believing",
      objective: "Explain in plain terms how generative AI makes realistic images, voices and video, and describe two ways synthetic media changes what counts as proof.",
      durationMinutes: 14,
      contentType: "article",
      isPreview: true,
      bodyMd: `## The clip that split the timeline

Ngozi is sixteen and lives in Port Harcourt. One night a short video spreads through her school's group chats. It appears to show a well-known local musician insulting fans from another city. Within an hour, people are angry, a hashtag is trending, and someone has already made a reaction song.

Two days later the musician posts the original footage. The real clip was from an interview where she was praising those fans. Someone had used an AI tool to change her lip movements and clone her voice. By then, thousands of people had seen the fake, and far fewer saw the correction.

This lesson is about why that is now easy to do, and what it does to the idea of proof.

## How generative AI makes media

**Generative AI** means AI that produces new content: text, images, audio or video. You do not need the maths to understand the core idea.

- **Training**: the model is shown a huge number of examples (millions of images with captions, hours of speech, large amounts of text). From them it learns patterns: what faces look like from different angles, how a voice rises at the end of a question, which words tend to follow which.
- **Generating**: when you give it a prompt, it produces something new that fits those patterns. An image model starts from random noise and refines it step by step into a picture that matches your description. A voice model produces audio with the patterns of a particular voice.

Two consequences matter for you:

1. **It needs surprisingly little of a specific person.** Because the model has already learned how faces and voices work in general, a short clip or a handful of photos can be enough to imitate one particular person.
2. **It optimises for "looks right", not "is true".** The output is designed to be plausible. Nothing in the process checks whether the event ever happened.

## Two ways proof has changed

**First: realistic is no longer evidence.** For most of history, a photo or recording was strong evidence that something happened, because faking it took skill, time and money. Now realism costs almost nothing, so a realistic image on its own proves much less than it used to.

**Second: real things can be dismissed as fake.** Legal scholars Bobby Chesney and Danielle Citron named this the **liar's dividend**. Once everyone knows fakes exist, a person caught on a real recording can simply claim "that's AI". Synthetic media does damage both ways: it makes fakes believable and makes truths deniable.

The answer is not to believe nothing. That is just as easy to exploit. The answer is to shift from **"does it look real?"** to **"where did it come from, and who can confirm it?"**

## Why fakes spread faster than corrections

Look at Ngozi's story as a system. An outrageous clip triggers strong emotion. Emotion drives shares. Shares push it into more feeds, which drives more shares. That is a reinforcing loop. The correction is calmer and less shareable, so it does not get the same loop. This is why the moment before you share matters so much: it is the one point in the loop where you have direct control.

## Play: calibrate your eye

Start with the warm-up. Judge each item as real, AI-made or edited, and note what you based the decision on. Pay attention to how confident you felt compared with how often you were right.

\`\`\`studio
fake-or-real:warm-up
\`\`\`

If your confidence was higher than your accuracy, you have just discovered why "I can always tell" is a dangerous belief.

## Try it now

Use the practice pad to look at the problem from the other side, without making any fake yourself.

\`\`\`try
I am a [YOUR AGE]-year-old learning about synthetic media. Without giving instructions for making deepfakes, explain from the faker's point of view why a fake video of a public figure might be made (list four different motives), and for each motive, what the faker hopes viewers will do in the first ten minutes after seeing it.
\`\`\`

Then, on paper, write a three-step **personal rule** for the next time a shocking clip of a real person reaches you. Each step must be an action you can actually take on your phone in under two minutes.

You are done when you have the four motives and your three-step rule.

**Reflect:** Which is the bigger risk in your own circle right now: people believing fakes, or people dismissing real things as "AI"? Why?`,
      microCheck: [
        {
          question: "Why can a voice-cloning tool imitate a specific person from only a short clip?",
          options: [
            "It already learned how voices work in general from many examples",
            "It secretly downloads every recording of that person it can find",
            "It needs at least several hours of that person to work properly",
            "It records the person live through their phone's microphone",
          ],
          correctIndex: 0,
          explanation:
            "The model learned general voice patterns in training, so a short sample is enough to steer it towards one person. That is why public clips are enough raw material.",
        },
        {
          question: "A politician caught on a genuine recording says, \"That's obviously AI.\" What is this an example of?",
          options: [
            "The filter bubble, because people only ever see their own side of it",
            "The liar's dividend, using the existence of fakes to deny truth",
            "A hallucination, because the AI made up the recording",
            "Lateral reading, because he checked other sources first",
          ],
          correctIndex: 1,
          explanation:
            "The liar's dividend is the benefit liars get once fakes are common: real evidence can be waved away as AI. It is the second harm of synthetic media.",
        },
        {
          question: "What does a generative image model optimise for when it makes a picture?",
          options: [
            "Matching a verified record of an event that took place",
            "Copying one existing photo from its training data exactly, pixel by pixel",
            "Producing something plausible that fits the prompt's patterns",
            "Checking each detail against news sources before output",
          ],
          correctIndex: 2,
          explanation:
            "Generation aims for plausibility given the prompt. Nothing in the process checks that the scene ever happened, which is why realism no longer proves anything.",
        },
        {
          question: "After learning about deepfakes, a friend says, \"So I'll just believe nothing.\" What is the problem with that?",
          options: [
            "It is the safest approach, so there is no real problem",
            "It only works for videos, not for photos, voice notes or text messages",
            "It is only a problem if the friend is over eighteen",
            "Blanket disbelief is exploitable too, so check origins instead",
          ],
          correctIndex: 3,
          explanation:
            "Believing nothing hands liars the same win as believing everything. The useful shift is from judging how real something looks to checking where it came from and who confirms it.",
        },
      ],
    },
    {
      title: "Deepfake forensics, and why tells expire",
      objective: "Inspect media for artefact and context clues, explain why visual tells become unreliable over time, and verify a suspicious request through an independent channel.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The principal's voice note

Malik is fifteen and lives in Detroit. A voice note circulates on a class group chat. It sounds exactly like the assistant principal announcing that a popular teacher has been fired for something shocking. The voice, the pauses and the slight accent are all right.

Malik's friend Jada says it has to be real: "Listen to it, that's literally her." Malik is not so sure. The message has no source, it appeared from a number nobody recognises, and the school's own channels say nothing. The next morning the school confirms it was a cloned voice made from a speech posted online.

Jada's mistake was a common one: treating **how real it sounds** as the test. Malik used a better one: **where it came from and who confirms it.**

## Two kinds of evidence

Forensic analysts (people who examine evidence) look at two layers.

**1. Artefact clues: inside the media**

- Hands, teeth and ears with the wrong number or shape of parts.
- Text in the image (signs, labels, jerseys) that turns into near-letters.
- Jewellery, glasses or hair that merge into skin or background.
- Lighting and shadows that do not agree with each other or with the light source.
- In video: lip movements that drift from the audio, unnatural blinking, a face that looks sharper or smoother than the neck and background.
- In audio: flat emotion, breathing in odd places, background noise that cuts in and out, words with the stress in the wrong place.

**2. Context clues: around the media**

- **Source**: who posted it first? An account with a history, or one created yesterday?
- **Corroboration**: does anyone independent and credible report the same thing?
- **Plausibility**: does it fit what you know about the person and the situation?
- **Motive and timing**: who gains if people believe it, and why now (before a vote, a match, an exam)?
- **The ask**: does it push you to act fast, send money, share a code or forward urgently?

## Why tells expire

Here is the uncomfortable part. Each generation of tools fixes the most famous artefacts. Hands improved. Text in images improved. Lip-sync improved. A checklist of visual tells that worked last year may fail this year.

That makes artefact clues **one-way evidence**. If you find a strong tell, that is a good reason to be suspicious. If you find no tell, that tells you almost nothing. Context clues age much more slowly, because they do not depend on the technology. A clip with no traceable source and no independent confirmation is unverified, however perfect it looks.

## Provenance: checking the label on the box

There is also work happening on **provenance**: a record of where a piece of media came from and how it was edited. An industry standard called C2PA lets cameras, editing apps and some AI tools attach this information, often shown as "Content Credentials". Some AI image tools also add hidden watermarks.

These help when they are present. But they are not everywhere yet, and they can be stripped by a screenshot or a re-upload. So a missing label does not prove a fake, and you still need your context habits.

## Out-of-band verification

For anything that asks you to **act** (send money, share a code, meet somewhere, forward urgently), use **out-of-band verification**. That means checking through a different channel from the one the message came in on. If the "school" voice note says something, check the school's official site or ask a teacher. If "your brother" messages from a new number asking for money, call his usual number. A scammer controls the channel they contacted you on. They usually do not control the others.

## Play: hunt the tells

Work through the tells challenge. For each item, list every artefact clue you find, then say what context you would still want before deciding. Notice which items have no visible tells at all.

\`\`\`studio
fake-or-real:deepfake-tells
\`\`\`

## Try it now

Build a **one-page verification card** you could share with a younger sibling or cousin. On paper or in a notes app:

1. Three artefact clues worth checking, written in simple words.
2. Three context questions to ask every time.
3. One out-of-band rule for messages that ask for money, codes or urgent action.
4. One sentence explaining why "I couldn't spot anything weird" does not mean it is real.

You are done when the card fits on one page and a ten-year-old could follow it.

**Reflect:** Why are context clues more durable than artefact clues as AI tools improve?`,
      microCheck: [
        {
          question: "You examine a viral clip carefully and find no visual artefacts at all. What does that tell you?",
          options: [
            "Very little, because artefacts become rarer as tools improve",
            "That it is genuine, because tools always leave artefacts",
            "That it is fake, because real footage is never that clean",
            "That it is genuine, if it has been shared over a thousand times",
          ],
          correctIndex: 0,
          explanation:
            "Artefact clues are one-way evidence: finding one raises suspicion, but finding none proves little because each tool generation fixes known tells. Context and source still have to be checked.",
        },
        {
          question: "A message from a new number, claiming to be your brother, asks for money urgently. What is out-of-band verification here?",
          options: [
            "Replying and asking a question that only he would know",
            "Calling your brother on the number you already have for him",
            "Asking the new number for a voice note to prove it is him",
            "Checking if the new number's profile photo looks like him",
          ],
          correctIndex: 1,
          explanation:
            "Out-of-band means using a different channel from the one the message came in on. The scammer controls the new number, including voice notes and profile photos sent from it.",
        },
        {
          question: "An image has no Content Credentials attached. What can you conclude?",
          options: [
            "It is definitely AI-generated, because real photos carry credentials",
            "It is definitely real, because AI tools always add a credential",
            "Not much, because credentials are not universal and can be stripped",
            "It is illegal to share, because credentials are now required by law",
          ],
          correctIndex: 2,
          explanation:
            "Provenance labels help when present, but many cameras and apps do not add them yet, and screenshots or re-uploads can remove them. Absence proves nothing either way.",
        },
        {
          question: "Which is a CONTEXT clue rather than an artefact clue?",
          options: [
            "The speaker's lips drift slightly out of time with the audio",
            "The letters on a jersey in the background are not real words",
            "The shadows in the picture fall in two different directions",
            "The account that first posted it was created the day before",
          ],
          correctIndex: 3,
          explanation:
            "Context clues come from around the media: source, history, corroboration and motive. Lip-sync, garbled text and shadows are artefact clues inside the media.",
        },
      ],
    },
    {
      title: "Why fluent is not the same as true",
      objective: "Explain why language models hallucinate, recognise the situations where it is most likely, and test an AI answer's sources before relying on it.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The essay with perfect references

Thandiwe is seventeen and lives in Durban. She is writing a history essay on the 1976 Soweto uprising and asks a chatbot for "five academic sources with page numbers". It gives her five beautifully formatted references: authors, titles, journals, years, pages.

She checks them in her school library's database. Two are real books on the topic. One is a real author, but the title is invented. Two do not exist at all. If she had submitted them, her teacher would have found out in minutes, and the problem would not have been the AI. It would have been her name on the essay.

## How a language model actually answers

A **large language model** (LLM) is trained on an enormous amount of text to do one thing: given the text so far, predict a likely next **token** (a word or part of a word). It produces an answer by repeating that step, token after token.

Training squeezes patterns from that text into the model's settings. It does not store a neat, searchable database of facts with sources attached. When you ask a question, the model produces the kind of text that typically follows that kind of question. Very often, that text is correct, because correct information appeared many times in training. But the mechanism is **plausibility**, not lookup.

That is why it hallucinates. A **hallucination** is fluent, confident output that is false or unsupported. A reference list is a perfect example: the model has seen thousands of references, so it knows exactly what one *looks like*. If it does not have a real one to hand, it can produce something with the right shape and the wrong substance.

Some tools now search the web or a document set before answering, which reduces this. But they can still misread a source, merge two sources, or cite a page that does not say what the answer claims. **A citation is a claim too. Check it.**

## When hallucinations are most likely

Watch for these high-risk requests:

- **Specific references, quotes and statistics**: the shape is easy to fake.
- **Niche or local topics**: less training text, so weaker patterns.
- **Recent events**: the model may not have them in its training data at all.
- **Precise details**: dates, numbers, names, page numbers.
- **Leading questions**: "Why did X happen?" can produce a confident explanation of something that did not happen.

And lower-risk uses, where the model's strengths fit the job: explaining a concept you will then verify, generating practice questions, critiquing your argument, rephrasing, brainstorming.

## Calibration: confidence is not a signal

People use confidence as a shortcut: if someone sounds sure, they probably know. That shortcut fails with language models, because their tone is mostly a style. A model can be fluent and wrong at the same time, and it does not reliably signal which answers are shaky. Asking "are you sure?" is not a real check either. The model may cheerfully confirm an error, or apologise and change a correct answer.

So treat the model like a fast, well-read classmate who sometimes bluffs. Useful for a first pass. Never the final source.

## Play: run a hallucination test

Try both of these in the practice pad. The first invites a hallucination on purpose.

\`\`\`try
Give me three academic sources, with authors, years and page numbers, about [A NICHE TOPIC FROM YOUR AREA OR SCHOOL SUBJECT]. Then, for each source, tell me honestly how confident you are that it exists and exactly how I could verify it.
\`\`\`

\`\`\`try
I am going to ask you about something that may not exist: the [MADE-UP EVENT] of [A REAL YEAR] in [A REAL CITY]. Before answering, tell me whether you have any reliable information about it. If you do not, say so plainly instead of guessing.
\`\`\`

Compare the two. Did asking it to state its confidence and verification route change the behaviour? Did the second prompt get an honest "I don't know"? Even when it does, keep checking: a good answer once is not a guarantee.

## Try it now

Run a **source audit** on any AI answer that includes sources or specific facts (use the first prompt above if you like).

1. Copy each source or specific fact into a list.
2. For each, try to verify it outside the chat: a library catalogue, the publisher's site, a well-known reference work, or an official page.
3. Mark each as **verified**, **partly right** (real but wrong details) or **not found**.
4. Write one sentence on what you would do differently next time you ask AI for sources.

You are done when every item has a verdict and you have your one-sentence rule.

**Reflect:** If an AI tool gave you three correct references in a row, how much should that raise your trust in the fourth? Why?`,
      microCheck: [
        {
          question: "Why can a language model produce a reference that looks perfect but does not exist?",
          options: [
            "It copies a random real reference and then changes the year on purpose",
            "It knows the shape of a reference well and generates a plausible one",
            "It searches a hidden database that contains some fake references",
            "It is programmed to include at least one fake to test students",
          ],
          correctIndex: 1,
          explanation:
            "The model generates text that fits learned patterns. It has seen many references, so it can produce the right format with invented content when it lacks a real match.",
        },
        {
          question: "Which request is MOST likely to produce a hallucination?",
          options: [
            "Explain what inflation means using an example about bread prices",
            "Write ten practice questions on the structure of a plant cell",
            "Give exact quotes from a council meeting in your town last month",
            "Suggest three different ways to structure a persuasive essay",
          ],
          correctIndex: 2,
          explanation:
            "Exact quotes, local detail and recent events are high-risk: little or no training text, and a quote's shape is easy to fake. The other tasks play to the model's strengths.",
        },
        {
          question: "You ask a chatbot, \"Are you sure?\" and it confirms its answer. How much has that checked the answer?",
          options: [
            "Very little, because the model's confidence is not a reliable signal",
            "Completely, because models must always tell the truth when asked directly",
            "Mostly, because a second answer uses a different part of the model",
            "Completely, as long as it confirms the same answer twice in a row",
          ],
          correctIndex: 0,
          explanation:
            "Asking the same model is not independent verification. It may confirm an error or abandon a correct answer, because its tone is a style rather than a measure of accuracy.",
        },
        {
          question: "A chatbot that searches the web gives an answer with a link. What is the right next step?",
          options: [
            "Trust it, because web search removes all the risk of hallucination",
            "Ignore the link, because search-based answers are always wrong",
            "Ask the chatbot to summarise the link a second time to confirm",
            "Open the link and check it actually says what the answer claims",
          ],
          correctIndex: 3,
          explanation:
            "Search reduces hallucinations but does not remove them: models can misread or misattribute sources. A citation is a claim, so open it and check.",
        },
      ],
    },
    {
      title: "Think like a fact-checker: SIFT and lateral reading",
      objective: "Apply the SIFT moves and lateral reading to a viral claim, trace it back to its original context, and reach a verdict you can defend.",
      durationMinutes: 16,
      contentType: "article",
      bodyMd: `## The miracle study

Yaw is fourteen and lives in Takoradi. A slick infographic appears on his feed: "Scientists confirm: students who drink [a certain energy drink] score 30% higher in exams." It has a university-style logo, a graph and a link to a site called something like "Global Student Health Institute". The site looks professional: clean design, an "About us" page, lots of articles.

Most people judge a source like this by reading it carefully, top to bottom: the design, the tone, the "About" page. That is called **vertical reading**, and it is exactly what a well-made fake is designed to pass.

## How professionals actually check

Researchers at Stanford who watched professional fact-checkers at work noticed that they did something different. Within seconds of landing on an unfamiliar site, fact-checkers **left it**. They opened new tabs and searched for what *other* sources said about the site and the claim. The researchers called this **lateral reading**: reading across the web rather than down the page.

It works because a site can say anything about itself, but it cannot control what everyone else says about it. In Yaw's case, a quick search for the "institute" name shows it is run by a marketing company connected to the drink's brand.

## The SIFT moves

Mike Caulfield, a researcher who works on digital literacy, packaged the fact-checker habits into four moves called **SIFT**:

1. **Stop.** Notice your reaction before you act. Ask: do I know this source? What do I actually want to know?
2. **Investigate the source.** Spend a minute finding out who is behind it, using lateral reading. What is their expertise? What do they gain?
3. **Find better coverage.** Look for the claim from sources you already trust. If the claim is big and true, someone credible is usually reporting it. You can often skip the original source entirely if better coverage exists.
4. **Trace claims to the original context.** Find where the quote, image or statistic first came from. Claims get distorted as they travel: a small study becomes "scientists confirm", a quote loses its first half, a photo from one year is reposted as news from another.

SIFT is fast. Most checks take one to three minutes. The point is not to research everything for an hour. It is to avoid being fooled in the first ninety seconds.

## Tracing the miracle study

Apply step 4 to Yaw's infographic. Suppose he traces "30% higher" and finds a real small study that, on closer reading, was about caffeine and reaction times in adults, not exam scores in students, with no mention of the brand. The infographic took a real source and changed what it said.

Common distortions to look for when tracing:

- **Scope creep**: a study of 40 adults becomes "students everywhere".
- **Correlation turned into causation**: people who do X also do Y, so "X causes Y".
- **Cropped context**: half a quote, a photo with the caption swapped, a graph with the axis cut.
- **Time shift**: an old event reposted as if it happened today.

For images, a **reverse image search** (searching with the picture instead of words) can show where else it has appeared and when, which is often enough to catch a time shift.

## Play: the fact-check challenge

Run the fact-check challenge. For each claim, decide which SIFT move gets you to an answer fastest, gather evidence, and give a verdict: true, false, misleading, or unverified. "Unverified" is a legitimate verdict, not a failure.

\`\`\`studio
fake-or-real:fact-check
\`\`\`

## Use AI as a research assistant, not a judge

AI can help you plan a check, but it should not be the verdict. Try:

\`\`\`try
Here is a claim I saw online: "[CLAIM]". Do not tell me whether it is true. Instead, walk me through the four SIFT moves for this specific claim: what I should notice when I stop, what to search to investigate the source, what kinds of trusted outlets would cover it, and what the original context might be and how to trace it.
\`\`\`

## Try it now

Pick a claim currently circulating in your world: a health tip, a "study says" post, a screenshot of a quote, an image of an event.

1. **Stop**: write your first reaction in one line.
2. **Investigate**: spend two minutes reading laterally about the source. Who is behind it?
3. **Find better coverage**: list two credible sources that do or do not report it.
4. **Trace**: find the earliest version you can, and note any distortion.
5. Give a verdict (true, false, misleading or unverified) with one sentence of justification.

You are done when you have all five steps written for one real claim.

**Reflect:** Which SIFT move would have saved the most people in your circle from the last fake you saw spread? Why that one?`,
      microCheck: [
        {
          question: "You land on an unfamiliar, professional-looking health site. What does lateral reading tell you to do first?",
          options: [
            "Read its About page carefully to judge its expertise",
            "Check whether the site has a secure padlock in the address bar",
            "Leave it and search what other sources say about the site",
            "Count how many articles the site has published so far",
          ],
          correctIndex: 2,
          explanation:
            "A site can say anything about itself and look professional for little cost. Lateral reading checks what independent sources say about it, which the site cannot control.",
        },
        {
          question: "A post says \"Scientists confirm X causes Y\". Tracing it, you find a study showing people who do X also tend to do Y. What distortion is this?",
          options: [
            "A time shift, because the study is older than the post itself",
            "A cropped quote, because a sentence was cut off",
            "Scope creep, because the sample was too small",
            "Correlation turned into causation, a very common distortion",
          ],
          correctIndex: 3,
          explanation:
            "The study found the two things go together, not that one causes the other. Turning \"linked with\" into \"causes\" is one of the most common distortions when claims travel.",
        },
        {
          question: "In SIFT, why can \"Find better coverage\" sometimes let you skip the original source entirely?",
          options: [
            "If trusted outlets already report and check it, you may not need the original",
            "Because original sources are always less accurate than news coverage",
            "Because SIFT says the first source you find must always be ignored",
            "Because tracing the original always takes far too long to ever be worthwhile",
          ],
          correctIndex: 0,
          explanation:
            "If credible sources have already covered and verified a claim, that can answer your question quickly. You only need to dig into an unknown source when better coverage is missing.",
        },
        {
          question: "A photo of a flood is shared as \"happening now\". Which tool is most useful for checking a time shift?",
          options: [
            "Zooming in to check the water looks realistic",
            "A reverse image search to see where and when it appeared before",
            "Asking a chatbot whether the photo looks recent or not, then trusting its verdict",
            "Reading the comments to see if people believe it",
          ],
          correctIndex: 1,
          explanation:
            "A reverse image search can show earlier appearances of the same picture, which reveals if an old photo is being reposted as new. Realistic water says nothing about the date.",
        },
      ],
    },
    {
      title: "Claim, evidence, reasoning: arguments that hold",
      objective: "Build and stress-test a claim-evidence-reasoning argument, weigh the quality of evidence, notice your own confirmation bias, and make a deliberate share decision.",
      durationMinutes: 16,
      contentType: "article",
      bodyMd: `## The debate in the group chat

Camila is sixteen and lives in Los Angeles. Her friends are arguing about whether phones should be banned in their school. Messages fly: "It's proven phones make you dumber." "My cousin's school banned them and everyone's grades went up." "That's just your opinion." Nobody changes their mind, because nobody is really arguing. They are just stating positions louder.

There is a tool that turns a shouting match into an argument: **claim, evidence, reasoning** (CER). Science teachers use it, lawyers use it, and good fact-checkers use it every day.

## The three parts

- **Claim**: a clear statement that could be true or false. Not "phones are bad" but "Banning phones during lessons improves students' focus in class."
- **Evidence**: the information that supports (or undermines) the claim. Observations, data, sources, examples.
- **Reasoning**: the bridge. Why does this evidence support this claim? What principle or mechanism connects them?

Most weak arguments fail at **reasoning**. "My cousin's school banned phones and grades went up" is evidence, but the reasoning gap is huge. Did anything else change at the same time? Did grades go up everywhere that year? Is one school representative?

## Weighing evidence

Not all evidence is equal. Ask these questions about any piece of evidence:

1. **Source**: who produced it, and do they have the expertise and a reason to be accurate?
2. **Independence**: is it from someone with something to gain? Is it confirmed by others who do not share that interest?
3. **Size and scope**: one anecdote, or many cases? Does it cover people like the ones in the claim?
4. **Directness**: does it measure the thing in the claim, or something next to it?
5. **Alternatives**: what else could explain the same evidence?

An anecdote is not worthless. It can be a good reason to look further. But it rarely carries a big claim on its own.

## Your own brain is part of the system

There is one more source of error, and it is in your head. **Confirmation bias** is the tendency to notice, search for and believe information that fits what you already think, and to scrutinise information that does not. Everyone has it. It is not a flaw in "other people".

You can counter it with two habits:

- **Steelman the other side**: state the opposing view in its strongest form, so well that someone who holds it would agree with your summary.
- **Name your crux**: ask, "What evidence would change my mind?" If the answer is "nothing", you are not reasoning any more. You are defending.

This connects to **first principles thinking**: breaking a question down to what you know for sure, then building up from there, rather than reasoning from what everyone says. "What do we actually know about how attention works in lessons?" is a first-principles question. "Everyone knows phones are bad" is not.

## The share decision

Fact-checking is not only about being right. It is about what you do next. Before you share, run a quick CER on the post itself:

- What is the claim, exactly?
- What evidence does it give, and how strong is it?
- Does the reasoning hold, or is there a gap?
- If I share this and it is wrong, who could be harmed?

If you cannot answer these, the honest options are: do not share, or share with context ("I haven't been able to verify this").

## Play: stress-test an argument

Use the AI as a sparring partner. It is good at generating counterarguments, which is exactly what confirmation bias hides from you.

\`\`\`try
My claim is: "[YOUR CLAIM ABOUT SOMETHING AT SCHOOL OR IN YOUR COMMUNITY]". My evidence is: "[YOUR EVIDENCE]". Act as a fair but tough debate coach. First, restate my claim more precisely. Then point out the biggest gap in my reasoning, give the strongest opposing argument (a steelman), and tell me what evidence would most change the conclusion. Do not take a side yourself.
\`\`\`

## Try it now

Take one claim you actually believe about a debate in your school or community (phone rules, uniforms, a local issue).

1. Write a full **CER**: one precise claim, at least two pieces of evidence, and reasoning that connects them.
2. Rate each piece of evidence on the five questions above.
3. Write a **steelman** of the opposing view in three sentences.
4. Write your **crux**: the evidence that would change your mind.
5. Run it past the debate-coach prompt and revise one part.

You are done when you have a revised CER, a steelman and a crux.

**Reflect:** Was it harder to write the steelman or the crux? What does that tell you about how strongly you held the claim?`,
      microCheck: [
        {
          question: "\"My cousin's school banned phones and grades went up.\" Where is the biggest weakness if this is used to support a ban everywhere?",
          options: [
            "The claim, because it does not mention grades at all",
            "The evidence, because cousins are never reliable sources",
            "The source, because the cousin is not a teacher",
            "The reasoning, because other causes and one school are not ruled out",
          ],
          correctIndex: 3,
          explanation:
            "The anecdote is evidence, but the bridge to \"a ban improves grades everywhere\" is weak: other changes may explain it, and one school may not represent others.",
        },
        {
          question: "What does it mean to steelman an argument?",
          options: [
            "State the opposing view so well its supporters would agree",
            "Find the weakest version of the other side and knock it down",
            "Repeat your own argument more forcefully until others agree",
            "Ask an AI to decide which side of the argument is correct",
          ],
          correctIndex: 0,
          explanation:
            "Steelmanning is the opposite of a straw man: you engage the strongest version of the other view. It counters confirmation bias and makes your own reasoning stronger.",
        },
        {
          question: "You notice you are carefully checking posts that disagree with you but sharing ones that agree without a second look. What is this?",
          options: [
            "Lateral reading, applied only to one side",
            "Confirmation bias",
            "The liar's dividend",
            "A reinforcing loop in the feed",
          ],
          correctIndex: 1,
          explanation:
            "Confirmation bias is scrutinising what you disagree with and waving through what you agree with. Everyone has it. Naming your crux and steelmanning help counter it.",
        },
        {
          question: "You cannot verify a post but think it might be important. Which share decision is most responsible?",
          options: [
            "Share it unchanged, because important things should spread fast",
            "Share it with a joke so people know not to take it too seriously",
            "Hold it, or share only with a clear note that it is unverified",
            "Share it but delete it later if somebody says it is false",
          ],
          correctIndex: 2,
          explanation:
            "If you cannot verify it, holding back or adding honest context limits harm. Deleting later rarely catches the copies already forwarded.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "A realistic video shows a public figure saying something shocking, but no credible outlet reports it and the first poster's account is new. What is the best verdict for now?",
      options: [
        "Unverified, and not to be shared until better evidence appears",
        "True, because the video quality is far too good to have been faked",
        "False, because public figures never say shocking things",
        "True, if more than one person in your chat has seen it",
      ],
      correctIndex: 0,
      explanation:
        "Strong realism with weak context (a new account, no corroboration) means unverified. Video quality is no longer evidence, and \"never\" is an assumption, not a check.",
    },
    {
      question: "Why is a checklist of visual deepfake tells less useful each year?",
      options: [
        "Because people get worse at noticing details as they get older",
        "Because each generation of tools fixes the best-known artefacts",
        "Because laws now ban AI tools from leaving any visual artefacts",
        "Because videos are compressed more heavily every single year",
      ],
      correctIndex: 1,
      explanation:
        "Developers improve exactly the artefacts people learn to spot, such as hands and text. Context checks age much more slowly because they do not depend on the technology.",
    },
    {
      question: "A student asks a chatbot for academic sources and gets five neat references. What should they do before using them?",
      options: [
        "Use them, because the formatting shows they came from a database",
        "Ask the chatbot whether the references are real and accept its answer",
        "Look each one up in a library catalogue or on the publisher's site",
        "Use only the ones with the most recent publication years",
      ],
      correctIndex: 2,
      explanation:
        "Models can produce perfectly formatted but invented references. Only checking outside the chat, in a catalogue or publisher site, verifies them.",
    },
    {
      question: "In SIFT, what does \"Trace claims to the original context\" protect you from most?",
      options: [
        "Being fooled by a website with a poor design",
        "Spending far too much time investigating every single claim you see online",
        "Agreeing with something your friends believe",
        "Distortions such as cropped quotes and old photos reposted as new",
      ],
      correctIndex: 3,
      explanation:
        "Claims change as they travel: quotes lose context, studies get exaggerated, old images get new captions. Tracing back reveals what was originally said or shown.",
    },
    {
      question: "Someone caught on a genuine video claims \"it's a deepfake\" to avoid blame. Why does this work on some people?",
      options: [
        "Because widespread awareness of fakes makes any recording deniable",
        "Because deepfakes are always detectable, so the claim is easy to test",
        "Because real videos usually have more visual artefacts than fakes",
        "Because the law treats every video as fake until proven otherwise",
      ],
      correctIndex: 0,
      explanation:
        "This is the liar's dividend: once people know fakes exist, real evidence can be dismissed. The answer is provenance and context, not blanket belief or disbelief.",
    },
    {
      question: "Why do language models hallucinate?",
      options: [
        "They are designed to include occasional errors so they seem more human",
        "They generate plausible text rather than looking up verified facts",
        "They only hallucinate when the internet connection is unstable",
        "They copy errors that users typed into them in earlier chats",
      ],
      correctIndex: 1,
      explanation:
        "A language model predicts likely next tokens. That usually produces correct text, but when it lacks the information it can still produce something plausible and false.",
    },
    {
      question: "A friend argues: \"Everyone at my school who uses a study app gets good grades, so the app causes good grades.\" What is the strongest challenge?",
      options: [
        "Study apps are expensive, so the argument does not matter",
        "Your friend's school is too small to count as evidence at all",
        "Students who choose study apps may already work harder",
        "Grades are not a real way to measure learning in any school",
      ],
      correctIndex: 2,
      explanation:
        "This is a correlation, not proof of causation. A third factor, like students who are already motivated choosing the app, could explain both.",
    },
    {
      question: "Which is the best example of lateral reading?",
      options: [
        "Reading an article twice over to understand its argument properly",
        "Checking an article's spelling and grammar for mistakes",
        "Reading the article's About page to learn about its authors",
        "Searching the publisher's name to see what others say about it",
      ],
      correctIndex: 3,
      explanation:
        "Lateral reading means leaving the page to see what independent sources say about it. Rereading and the About page are vertical reading: the source talking about itself.",
    },
    {
      question: "You hold a strong opinion and want to test it fairly. Which question best guards against confirmation bias?",
      options: [
        "What evidence would change my mind about this?",
        "How many people already agree with my view?",
        "Which sources support my view most strongly of all?",
        "How can I explain my view more forcefully?",
      ],
      correctIndex: 0,
      explanation:
        "Naming your crux, the evidence that would change your mind, forces you to treat your view as testable. The other questions all look for support you already expect.",
    },
    {
      question: "An infographic cites a real study, but the study was about adults' reaction times, not students' exam scores. What has happened?",
      options: [
        "The study was fabricated by the people who made the graphic",
        "The claim stretched the study's scope beyond what it tested",
        "The study is unreliable because it is about reaction times",
        "Nothing is wrong, because the study itself is a real one",
      ],
      correctIndex: 1,
      explanation:
        "This is scope creep: a real source is used to support a claim it never tested. A real citation does not mean the claim matches what the source found.",
    },
    {
      question: "A web-searching AI gives an answer with three links. What is the most accurate view of those links?",
      options: [
        "They prove the answer is correct, because the AI found them",
        "They are always fake, because AI cannot read websites",
        "They are claims too, so open them and check what they say",
        "They are only useful if they come from news websites",
      ],
      correctIndex: 2,
      explanation:
        "Search reduces hallucination but the model can still misread or misattribute pages. A citation is something to check, not proof by itself.",
    },
  ],
};
// ═════════════════════════════════════════════════════════════════════════
// MODULE 5 · Systems are everywhere
// ═════════════════════════════════════════════════════════════════════════

const M5: SeedModule = {
  title: "Systems are everywhere",
  summary:
    "Think like a systems analyst about the world you live in: a school canteen, a game economy, a city's traffic, a school timetable, a family business. Map stocks and flows, trace reinforcing and balancing loops, find bottlenecks and delays, predict unintended consequences, and choose leverage points that actually change outcomes.",
  lessons: [
    {
      title: "Seeing systems: parts, stocks, flows and purpose",
      objective: "Map a real system in terms of its parts, connections, stocks, flows and purpose, and use the iceberg model to look below a single event.",
      durationMinutes: 14,
      contentType: "article",
      bodyMd: `## The canteen that ran out every Friday

Wanjiru is sixteen and goes to a day school in Nairobi. Every Friday, the canteen runs out of chapati before the second break. Students blame the cooks. The cooks blame the students for "suddenly" wanting more. The bursar blames the budget. Everyone has a villain. Nobody has an explanation.

Wanjiru tries something different. Instead of asking "whose fault is it?", she asks "what is the system doing?" That one switch, from blame to structure, is what systems thinking is.

## Parts, connections, purpose

A **system** is a set of parts connected in a way that produces a pattern of behaviour over time, usually in service of some purpose. Three things to identify:

- **Parts** (elements): the cooks, the flour delivery, the ovens, the students, the price, the timetable.
- **Connections** (interconnections): the flour delivery limits how much can be cooked; the timetable decides when students arrive; the price affects what they choose.
- **Purpose** (function): what the system actually does, which is not always what it says it does. A canteen's stated purpose is "feed students". Its real behaviour might be "feed whoever arrives first".

Donella Meadows, an environmental scientist and one of the best-known writers on systems thinking, pointed out that the parts are usually the least important thing to change. You can replace every cook and the system will often behave the same way. The connections and the purpose drive the behaviour.

## Stocks and flows

Two ideas make systems precise:

- A **stock** is an amount of something at a moment in time: chapati in the warming tray, coins in your game wallet, money in a family shop's till, followers on an account, water in a tank.
- A **flow** is the rate at which a stock changes: chapati cooked per hour (inflow), chapati sold per minute (outflow).

A stock rises when inflow beats outflow and falls when outflow beats inflow. That sounds obvious, but it explains a lot. On Friday, Wanjiru discovers, a sports fixture moves the first break earlier for half the school. Two big outflows hit the tray at nearly the same time, while the inflow (cooking speed) is fixed by two ovens. The stock hits zero. Nobody changed their behaviour. The structure changed.

Stocks also act as **buffers**. A bigger warming tray, prepared earlier, absorbs a burst of demand. That is why a family shop keeps some stock in the back room, and why you keep some savings.

## The iceberg model

The **iceberg model** is a way of digging below what you see:

1. **Events**: what happened. "We ran out of chapati on Friday."
2. **Patterns**: what keeps happening. "We run out every Friday, around 10:40."
3. **Structures**: what causes the pattern. "Two ovens, a fixed cooking rate, and a timetable that stacks two breaks together on Fridays."
4. **Mental models**: the beliefs that keep the structure in place. "The timetable is fixed and the canteen just has to cope."

Most arguments happen at the event level ("who messed up today?"). Most lasting fixes happen at the structure or mental-model level.

## Play: map the lunch queue

Use the system mapper to explore a lunch queue. Identify the stocks (people waiting, food ready), the flows (arrivals, servings) and the connections. Then test changes and predict their effect before you run them.

\`\`\`studio
system-mapper:lunch-queue
\`\`\`

Which changes did nothing? What does that tell you about where the constraint was?

## Try it now

Pick a system you are part of: a canteen, a sports team's training schedule, a family business, a group project, a matatu or bus route you use.

1. List at least six **parts** and draw the **connections** between them.
2. Name one **stock** and its **inflows** and **outflows**.
3. State the system's **stated purpose** and its **actual behaviour**, if they differ.
4. Take one recurring problem through the **iceberg**: event, pattern, structure, mental model.

You are done when your map shows parts, connections, one stock with its flows, and a four-level iceberg.

**Reflect:** At which level of the iceberg do most conversations about this problem happen today? What would change if people talked one level lower?`,
      microCheck: [
        {
          question: "A canteen replaces all its cooks but still runs out of food on Fridays. What does systems thinking suggest?",
          options: [
            "The new cooks need more training before they can be judged",
            "The structure, not the people, is producing the shortage",
            "The students are deliberately eating more on Fridays to cause trouble",
            "The problem will fix itself once the new cooks settle in",
          ],
          correctIndex: 1,
          explanation:
            "When changing the parts leaves the behaviour the same, the connections and structure are driving it. Timetables, capacity and timing are where to look.",
        },
        {
          question: "Which of these is a stock rather than a flow?",
          options: [
            "Chapati cooked per hour",
            "Students arriving per minute",
            "Money in the shop's till right now",
            "Followers gained each week",
          ],
          correctIndex: 2,
          explanation:
            "A stock is an amount at a moment in time, like the money in the till. The others are rates of change: flows into or out of a stock.",
        },
        {
          question: "\"We always run out at 10:40 on Fridays.\" Which level of the iceberg model is this?",
          options: [
            "A pattern",
            "An event that happened once",
            "A structure that causes behaviour",
            "A mental model that people hold",
          ],
          correctIndex: 0,
          explanation:
            "A pattern is something that keeps happening over time. An event is one occurrence, a structure is what causes the pattern, and a mental model is the belief that keeps the structure in place.",
        },
        {
          question: "Why does a family shop keep extra stock in the back room?",
          options: [
            "To make the shop look busier to customers walking past",
            "Because suppliers refuse to deliver small amounts of anything",
            "To make the stock count higher at the end of the year",
            "It acts as a buffer that absorbs sudden bursts of demand",
          ],
          correctIndex: 3,
          explanation:
            "A stock buffers the gap between inflow and outflow. When demand spikes faster than deliveries can respond, the back-room stock keeps the shelves from emptying.",
        },
      ],
    },
    {
      title: "Game economies: sources, sinks and runaway loops",
      objective: "Model a game economy as stocks and flows, explain inflation and rich-get-richer dynamics as reinforcing loops, and propose balancing mechanisms.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The market that broke

Abdi is fifteen and lives in Minneapolis. He plays an online survival game with a player-run market. At launch, a rare backpack sold for about 200 gold. Six months later the same backpack trades for 40,000. Meanwhile, new players complain that the game is "impossible" and quit within a week.

The developers did not change any prices. The economy did it by itself. To understand how, model it the way game economy designers do: as a system of stocks, flows and loops.

## Sources, sinks and the money supply

In game design:

- **Sources** (faucets) create currency or items: quest rewards, monster drops, daily log-in bonuses, selling to the game's own shop.
- **Sinks** (drains) destroy currency or items: repair costs, crafting fees, consumables, taxes on market trades, items that break.
- The **money supply** is the stock: all the gold held by all players.

If sources outpace sinks over time, the money supply grows. If the number of genuinely scarce items stays roughly fixed, more gold chases the same items, and prices rise. That is **inflation**: each unit of currency buys less. The same basic logic applies in real economies, though real ones are far more complicated.

Inflation hits groups unequally. Veteran players hold huge stocks of gold and barely notice. New players earn a few hundred gold an hour in a market priced in tens of thousands. Their effective wealth is tiny, so they quit. Fewer new players means a smaller, older community, which can slowly kill the game.

## Rich get richer: a reinforcing loop

Look at the structure that drives the gap:

> More gold → buy better gear → farm faster and safer → earn more gold → buy even better gear...

The output feeds back into the input and amplifies it. That is a **reinforcing loop** (sometimes labelled R). Reinforcing loops produce exponential growth or collapse: things accelerate. You see them everywhere: compound interest, viral posts, a team that wins, gets better recruits, wins more.

Now add a second loop:

> Market prices rise → new players can afford less → more new players quit → fewer buyers for low-tier items → veterans sell to each other at even higher prices...

Two reinforcing loops, feeding each other. No villain required.

## Balancing mechanisms

A **balancing loop** (labelled B) pushes a system towards a target. Designers add them deliberately:

- **Scaling sinks**: repair costs or taxes that rise with how rich you are, so big wallets drain faster.
- **Soft caps**: diminishing rewards after a certain amount of farming per day.
- **Bound items**: the best gear cannot be traded, so it cannot be bought with inflated gold.
- **Catch-up mechanics**: extra rewards for newer players, narrowing the gap.

Each one changes behaviour, sometimes in unwanted ways. Bound items can kill the market's fun. Daily caps can push players to make extra accounts. Good designers model second-order effects: "if we do this, what will players do next?"

## Play: run the economy

Take control of a game economy in the system mapper. Adjust sources and sinks, watch the money supply and prices, and track what happens to new players. Try to get a stable economy where newcomers can still progress.

\`\`\`studio
system-mapper:game-economy
\`\`\`

Note one change that fixed inflation but created a new problem. That is a second-order effect.

## Try it now

Use the AI as a design critic for an economy you design.

\`\`\`try
I am designing the economy for a small game: [DESCRIBE THE GAME IN TWO SENTENCES]. Sources: [LIST]. Sinks: [LIST]. Act as an experienced game economy designer. Identify any reinforcing loops that could cause inflation or a rich-get-richer gap, then predict how players would exploit my design. Do not redesign it for me; ask me two questions that would help me fix it myself.
\`\`\`

Then, on paper:

1. Draw your economy as a stock (money supply) with source and sink arrows.
2. Draw one reinforcing loop and one balancing loop, labelled R and B.
3. Add one balancing mechanism and write one second-order effect it could cause.

You are done when you have the stock-and-flow diagram, two labelled loops, and one mechanism with its side effect.

**Reflect:** Where else in your life does a rich-get-richer loop operate (in school, sport, social media)? What balancing loop, if any, keeps it in check?`,
      microCheck: [
        {
          question: "A game's gold sources steadily outpace its sinks while rare items stay scarce. What is the most likely long-term result?",
          options: [
            "Prices for rare items fall as players get bored of them",
            "Prices stay stable because players spend at a constant rate",
            "Gold disappears from the game because players lose interest",
            "Prices for rare items rise because more gold chases them",
          ],
          correctIndex: 3,
          explanation:
            "When the money supply grows faster than the supply of scarce goods, prices rise. That is inflation, and it hurts players with small stocks of gold most.",
        },
        {
          question: "Which is an example of a sink in a game economy?",
          options: [
            "A repair cost that removes gold from the game",
            "A quest reward that gives players new gold",
            "A monster that drops a rare item when defeated",
            "A daily log-in bonus that adds gold each day",
          ],
          correctIndex: 0,
          explanation:
            "A sink destroys currency or items, like repair costs. Quest rewards, monster drops and log-in bonuses are sources that add to the money supply.",
        },
        {
          question: "\"More gold buys better gear, which earns more gold faster.\" What kind of loop is this?",
          options: [
            "A balancing loop that keeps the economy stable over time",
            "A reinforcing loop that accelerates the gap between players",
            "A delay that slows down how fast prices change in the market",
            "A bottleneck that stops players earning more than a set amount",
          ],
          correctIndex: 1,
          explanation:
            "The output (more gold) feeds back to increase itself, so it is a reinforcing loop. Left unchecked, it widens the gap between rich and new players.",
        },
        {
          question: "Designers make repair costs rise with a player's wealth. What is this trying to do?",
          options: [
            "Reward the richest players for staying in the game longer",
            "Make the game harder for new players so they learn faster",
            "Add a balancing loop that drains big wallets faster",
            "Remove every source of gold from the game economy",
          ],
          correctIndex: 2,
          explanation:
            "A scaling sink is a balancing mechanism: the more gold you hold, the faster it drains, which counters the rich-get-richer loop.",
        },
      ],
    },
    {
      title: "Feedback loops, delays and oscillation",
      objective: "Identify reinforcing and balancing loops in real situations, explain how delays cause overshoot and oscillation, and predict a system's behaviour from its loop structure.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The rush hour that moved

Seun is seventeen and lives in Lagos. His route to school crosses a busy junction. When traffic got bad, a navigation app started sending drivers down a quiet side street. For a week, the side street was a brilliant shortcut. Then every navigation app found it. Now the side street is jammed, the residents have put up speed bumps, and the main road is moving again. So the apps send people back to the main road. Which jams. So they send them to the side street...

The traffic is not random. It is oscillating, swinging back and forth, and the cause is a **balancing loop with a delay**.

## The two loop types, precisely

**Reinforcing loops (R)** amplify change in the same direction. More leads to more, or less leads to less. They produce growth or collapse.

- A video gets engagement → the algorithm shows it more → more engagement.
- A team loses → morale drops → they lose again.
- You practise → you improve → practice is more rewarding → you practise more.

**Balancing loops (B)** counteract change and push a system towards a goal or limit. They produce stability, or oscillation if there is a delay.

- Your body overheats → you sweat → you cool down.
- A road gets congested → drivers choose other routes → congestion falls.
- A shop's stock runs low → it orders more → stock returns to target.

How to tell them apart: follow the loop all the way round. If a change comes back to push the original change further, it is reinforcing. If it comes back to oppose the original change, it is balancing.

Real systems contain both, and which one **dominates** can shift. Early in a viral trend, the reinforcing loop of sharing dominates. Later, a balancing loop takes over: everyone has seen it, novelty runs out, and attention falls. That shift explains the familiar S-shaped curve of trends.

## Delays: the hidden troublemaker

A **delay** is a gap between an action and its effect. Delays are everywhere: between studying and test results, between ordering stock and receiving it, between a city building a road and drivers changing their habits, between an app recommending a route and thousands of drivers arriving there.

When a balancing loop has a delay, people (and algorithms) react to old information. They keep correcting after the correction has already been made, so they overshoot. Then they correct the overshoot, and overshoot again. That is **oscillation**. Seun's side street is a textbook case: the information "the side street is clear" is already out of date by the time everyone acts on it.

A family shop shows the same pattern. Sales jump, so the owner orders extra stock. Delivery takes a week. Sales keep looking strong, so she orders more. Then all the deliveries arrive as the jump fades, and she is stuck with too much stock, so she cuts orders sharply, and runs short a few weeks later.

Ways to handle delays:

- **Respond more gently**: smaller corrections, given time to work.
- **Shorten the delay**: faster information or faster delivery.
- **Account for what is in the pipeline**: count stock already ordered, not just stock on the shelf.

## Play: loop lab

Work through the feedback loop challenge. Label each loop R or B, find the delays, and predict whether each system will grow, stabilise or oscillate before you run it.

\`\`\`studio
system-mapper:feedback-loops
\`\`\`

## Try it now

Choose a situation you know: a trend at school, your sleep and energy across a week, a team's form, a family business's stock, traffic on your route.

1. Draw at least **one reinforcing and one balancing loop** in it, labelled R and B, with the direction of each link.
2. Mark one **delay** with two short lines across the arrow (the usual symbol).
3. Predict the behaviour over time: growth, collapse, stability or oscillation. Sketch a rough graph.
4. Suggest one change that would reduce overshoot.

If you want a second opinion, use the practice pad:

\`\`\`try
Here is a loop I think I have found: [DESCRIBE THE CHAIN OF CAUSES]. Do not give me the answer straight away. Ask me questions to help me check whether it is reinforcing or balancing, and whether there is a delay that could cause overshoot.
\`\`\`

You are done when you have two labelled loops, a marked delay, a behaviour graph and one change.

**Reflect:** Think of a time you overreacted to something because the result of your first action had not shown up yet. Where was the delay?`,
      microCheck: [
        {
          question: "A road gets jammed, so apps send drivers elsewhere, so the road clears, so apps send drivers back. Why does it keep swinging?",
          options: [
            "A balancing loop is acting on delayed information, so it overshoots",
            "A reinforcing loop keeps adding more and more cars to the city every week",
            "The apps are randomly choosing a road for each driver",
            "There is no loop, just bad luck with the timing of traffic",
          ],
          correctIndex: 0,
          explanation:
            "Rerouting is a balancing loop, but by the time drivers arrive the information is stale, so everyone overcorrects. Balancing loops with delays oscillate.",
        },
        {
          question: "How can you tell whether a loop is reinforcing or balancing?",
          options: [
            "Count how many parts there are: more than four parts means it is reinforcing",
            "See if a change returns to push itself further or to oppose itself",
            "Ask whether the outcome is good or bad for the people involved",
            "Look at whether the loop involves money or people",
          ],
          correctIndex: 1,
          explanation:
            "Trace the loop round. If a change returns to amplify itself, it is reinforcing; if it returns to counteract itself, it is balancing. Good and bad outcomes can come from either.",
        },
        {
          question: "A shop owner keeps ordering more because shelves still look low, forgetting deliveries already on the way. What should she do?",
          options: [
            "Order even more, to make absolutely sure she never runs out again",
            "Stop ordering completely until the shelves are full",
            "Count the stock already ordered, not just what is on the shelf",
            "Change suppliers every week to find a faster delivery",
          ],
          correctIndex: 2,
          explanation:
            "Accounting for what is already in the pipeline stops the overshoot that delays cause. Ordering more makes it worse, and stopping completely causes the opposite swing.",
        },
        {
          question: "A trend explodes, then levels off and fades. What explains the shape?",
          options: [
            "The trend's creator decided to stop posting halfway through",
            "Only a reinforcing loop was ever acting on the trend",
            "Trends always follow random patterns that nobody can ever explain properly",
            "A reinforcing loop dominated early, then a balancing loop took over",
          ],
          correctIndex: 3,
          explanation:
            "Sharing drives early growth (reinforcing). As people saturate and novelty fades, a balancing loop dominates and growth stops. Loop dominance shifting gives the S-shaped curve.",
        },
      ],
    },
    {
      title: "Bottlenecks and the timetable problem",
      objective: "Find the constraint in a process, explain why improving anything else barely helps, and use the 5 Whys to reach a root cause worth fixing.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The science lab that ran the whole school

Kezia is sixteen and her school in Kampala is redesigning its timetable. Every year the same complaints: some classes get three science practicals in a week and others get none; teachers run between buildings; Year 12 has a free period in the middle of a double maths lesson.

The deputy head has tried adding more teachers, extending the school day, and new timetabling software. Each change helped a little, then the same problems returned. Kezia, who is on the student council, asks a question nobody has asked: **what is the one thing everything else has to wait for?**

The answer: the school has one fully equipped science lab. Every practical in every year has to fit into it. Every other part of the timetable is arranged around the lab's slots. The lab is the **constraint**.

## The theory of constraints

Eliyahu Goldratt, a physicist turned management thinker, popularised an idea called the **theory of constraints**. At its core:

- Any process that runs through steps has **one step that limits the output of the whole**. That is the **bottleneck** (or constraint).
- **Improving a non-bottleneck step does not increase total output.** It just creates a bigger queue in front of the bottleneck.
- An hour lost at the bottleneck is an hour lost for the whole system. An hour saved anywhere else is often an illusion.

Goldratt suggested five focusing steps, which work just as well at school as in a factory:

1. **Identify** the constraint.
2. **Exploit** it: make sure it is never idle or wasted. (Is the lab ever empty during a lesson? Used for things that do not need it?)
3. **Subordinate** everything else to it: schedule other things around the constraint's needs, not the other way round.
4. **Elevate** it: if still not enough, add capacity. (Convert a classroom into a second lab; run practicals in a rotating carousel.)
5. **Repeat**: once this constraint is fixed, a new one appears somewhere else. Find it.

Notice the order. Spending money (step 4) comes after squeezing everything from what you have (steps 2 and 3).

## Finding the root cause: 5 Whys

The bottleneck tells you *where* the system is limited. It does not always tell you *why*. The **5 Whys**, a technique associated with Toyota's production system, pushes you past the first answer.

1. Why do some classes get no practicals? *Because the lab is fully booked.*
2. Why is it fully booked? *Because exams-year classes book it for whole double periods.*
3. Why whole doubles? *Because setting up and clearing equipment takes 25 minutes.*
4. Why does set-up take so long? *Because equipment is stored in a cupboard in another building.*
5. Why is it stored there? *Because the lab's own cupboards were filled with old exam papers years ago.*

A root cause like "the cupboards are full of old paper" sounds trivial. But fixing it could cut set-up time, free a third of the lab's hours, and give practicals back to every class, at almost no cost. That is the power of combining constraint thinking with root cause analysis.

Two cautions. Real problems often have **several** root causes, so the whys can branch. And the 5 Whys can drift towards blaming a person ("Why? Because Mr X is disorganised"). When you hit a person, ask why the system made that easy, and keep going.

## Play: find the constraint with AI as your coach

\`\`\`try
I want to find the bottleneck in this process: [DESCRIBE A PROCESS, FOR EXAMPLE SCHOOL MORNING DROP-OFF, LUNCH SERVICE, A GROUP PROJECT, A FAMILY SHOP'S RESTOCKING]. Coach me through Goldratt's five focusing steps. Ask one question at a time and wait for my answer. Do not tell me where the bottleneck is; help me find it. Then help me run a 5 Whys on it.
\`\`\`

## Try it now

Pick a process in your school, home or community that people complain about.

1. Write the steps in order, and estimate each step's capacity (how many per hour, or how long each takes).
2. **Identify** the constraint. Show the evidence (where does the queue build up?).
3. Write one action each for **exploit**, **subordinate** and **elevate**.
4. Run a **5 Whys** on why the constraint exists. Stop at a cause the system could change.
5. Predict what will become the **new** constraint once yours is fixed.

You are done when you have the steps, the constraint with evidence, three actions, a whys chain and a prediction.

**Reflect:** Why do people so often improve the steps that are easiest to improve, rather than the bottleneck?`,
      microCheck: [
        {
          question: "A school's photocopier is the bottleneck for printing exam papers. The office buys faster computers. What happens to total printing?",
          options: [
            "It doubles, because faster computers send all the jobs more quickly",
            "It improves a little, because every step counts equally",
            "It falls, because faster computers use more electricity",
            "It barely changes, because the photocopier still limits output",
          ],
          correctIndex: 3,
          explanation:
            "Improving a non-bottleneck step does not raise total output. Jobs reach the copier faster, then wait there. Only improving the constraint raises throughput.",
        },
        {
          question: "In Goldratt's steps, what does \"exploit the constraint\" mean?",
          options: [
            "Make sure the bottleneck is never idle or used for work that does not need it",
            "Replace the bottleneck straight away with a bigger and much more expensive version",
            "Remove the bottleneck from the process entirely and work around it",
            "Ignore the bottleneck and speed up all the other steps instead",
          ],
          correctIndex: 0,
          explanation:
            "Exploiting means getting the most from the constraint you already have before spending money. Elevating (adding capacity) comes later.",
        },
        {
          question: "A 5 Whys chain ends with \"because the teacher is disorganised\". What should you do?",
          options: [
            "Stop there, because the root cause has been found",
            "Ask why the system makes that easy, and keep going",
            "Start again with a completely different problem",
            "Report the teacher, because blame fixes the system",
          ],
          correctIndex: 1,
          explanation:
            "Landing on a person usually means you have stopped too early. Asking what in the system allows it gets you to a cause you can actually change.",
        },
        {
          question: "A school converts a classroom into a second lab, and the timetable improves. What does the theory of constraints predict next?",
          options: [
            "No further problems, because the bottleneck has been removed",
            "The original lab will become the bottleneck again immediately",
            "A new constraint will appear somewhere else in the system",
            "The school will need to remove the new lab to balance things",
          ],
          correctIndex: 2,
          explanation:
            "Every system has some constraint. Elevating one shifts the limit elsewhere (perhaps science teachers' hours), which is why the last step is to repeat.",
        },
      ],
    },
    {
      title: "Leverage points and unintended consequences",
      objective: "Rank possible interventions by leverage, recognise Goodhart's law and induced demand in real situations, and predict second-order effects before acting.",
      durationMinutes: 16,
      contentType: "article",
      bodyMd: `## The reading challenge that backfired

A school in Cape Town launches a reading challenge: the class that reads the most books this term wins a trip. Excitement is huge. By week four, the numbers are astonishing. Then a teacher notices something. Students have stopped reading novels. They are reading the thinnest picture books in the library, five a day. The book count is soaring. Actual reading is falling.

No one cheated. Everyone did exactly what the system rewarded.

## Goodhart's law

This pattern has a name: **Goodhart's law**, after the economist Charles Goodhart. It is usually summarised as: **when a measure becomes a target, it ceases to be a good measure.** "Books read" was a decent signal of reading while nobody was aiming at it. The moment it became the target, people optimised the number instead of the thing it was meant to show.

You will see Goodhart's law everywhere once you look:

- A social app that targets "time in app" may get more time and less wellbeing.
- A school judged only on exam pass rates may teach to the test.
- A delivery service that targets "on-time deliveries" may mark deliveries as done before they arrive.
- An AI system trained to maximise a score can find strange shortcuts that raise the score without doing the task. People who build AI worry about this a lot.

The fix is rarely "find the perfect number". It is to use several measures, keep looking at the real thing, and change measures when they start being gamed.

## Induced demand: when the fix feeds the problem

Back to traffic. A city widens a congested road. For a while, journeys are faster. Then driving becomes more attractive, so more people drive, take longer trips or move further out. Within a few years, the wider road can be as congested as before. Transport planners call this **induced demand**: adding capacity can create the demand that fills it.

It is a reinforcing loop hiding inside a balancing one. That does not mean new roads are always wrong. It means "more capacity" is not automatically a fix, and you have to predict how people will respond.

## Leverage points

Donella Meadows wrote a famous essay listing **leverage points**: places to intervene in a system, from weak to strong. A simplified version you can use:

1. **Numbers** (weakest, but most common): budgets, prices, targets, the width of a road. Easy to change, usually little lasting effect.
2. **Buffers and stocks**: how much is stored to absorb shocks.
3. **Structure and delays**: physical layout, how long feedback takes.
4. **Feedback loops**: strengthening a balancing loop, slowing a reinforcing one.
5. **Information flows**: who knows what, when. (A shop owner who sees real-time sales makes better orders.)
6. **Rules**: incentives, punishments, who is allowed to do what.
7. **Goals**: what the system is actually trying to achieve.
8. **Mindsets** (strongest, hardest): the shared beliefs out of which goals and rules arise.

Higher leverage points are harder to move, and they change far more. In the reading challenge, changing the number ("count pages, not books") is weak and gets gamed again. Changing the goal ("every student finds one book they love") and the information (students share recommendations) is stronger.

## Predicting second-order effects

A **first-order effect** is the direct result of an action. A **second-order effect** is what happens because of that result. Before any fix, ask:

- How will people's behaviour change in response?
- What will they optimise if this becomes a target?
- Which loop am I strengthening or weakening?
- Who benefits, who loses, and how will they react?

## Play: question your fix

\`\`\`try
I want to solve this problem: [A PROBLEM IN YOUR SCHOOL, TEAM OR COMMUNITY]. My proposed fix is: [YOUR FIX]. Act as a systems thinking coach. Ask me questions, one at a time, to help me find (1) any way this fix could be gamed under Goodhart's law, (2) any second-order effect that could undo it, and (3) where my fix sits on Meadows's leverage points. Do not propose a different fix unless I ask.
\`\`\`

## Try it now

Pick a rule, target or fix in your school or community (a reward scheme, a phone policy, a traffic measure, a fundraising target).

1. Write its **first-order** intended effect.
2. Write two possible **second-order** effects, at least one unintended.
3. Check it for **Goodhart's law**: how could people hit the number without achieving the goal?
4. Place it on the **leverage ladder** and propose one intervention at least two levels higher.
5. Predict a second-order effect of your own proposal.

You are done when you have all five parts written for one real example.

**Reflect:** Why do organisations so often reach for the weakest leverage points first, even when they know higher ones exist?`,
      microCheck: [
        {
          question: "A school rewards the class that reads the most books, and students switch to the thinnest books. What is this an example of?",
          options: [
            "A bottleneck in the school library's system",
            "Goodhart's law: the measure became the target",
            "Induced demand caused by buying lots of new books",
            "A balancing loop with a long delay",
          ],
          correctIndex: 1,
          explanation:
            "Once \"books read\" became the target, students optimised the count rather than the reading it was supposed to measure. That is Goodhart's law.",
        },
        {
          question: "A city widens a road and, a few years later, it is as congested as before. Which idea best explains this?",
          options: [
            "Goodhart's law, because the road was measured wrongly",
            "The theory of constraints, because a brand new bottleneck appeared",
            "Induced demand, because easier driving attracted more traffic",
            "Confirmation bias, because planners ignored the evidence",
          ],
          correctIndex: 2,
          explanation:
            "Adding road capacity made driving more attractive, so more trips filled the new space. That is induced demand, a reinforcing response to a capacity fix.",
        },
        {
          question: "Which intervention is HIGHEST on the leverage ladder?",
          options: [
            "Changing what the system is actually trying to achieve",
            "Increasing the budget for the whole project by ten percent",
            "Building a larger buffer of stock in the storeroom",
            "Shortening the delay before results are reported",
          ],
          correctIndex: 0,
          explanation:
            "Goals sit above numbers, buffers and delays. Changing what the system aims for reshapes the rules and behaviour below it.",
        },
        {
          question: "Before introducing a new rule, what is the most useful question for spotting second-order effects?",
          options: [
            "How quickly can the rule be written and announced?",
            "Which staff member should be in charge of the rule?",
            "How many other schools already have the same rule?",
            "How will people change their behaviour in response?",
          ],
          correctIndex: 3,
          explanation:
            "Second-order effects come from how people react to the first change. Asking how behaviour will shift exposes gaming, workarounds and side effects early.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "Your school's lunch queue is slow. The school adds a second serving counter, but the queue barely moves faster. What should you check first?",
      options: [
        "Whether the till, not the counter, is the real bottleneck",
        "Whether students are walking more slowly than last year",
        "Whether the new counter is the same colour as the old one",
        "Whether the cooks need to be replaced with faster cooks",
      ],
      correctIndex: 0,
      explanation:
        "If adding capacity at one step does not help, that step was not the constraint. Find where the queue actually builds, such as a single till.",
    },
    {
      question: "Which pair correctly matches a loop to its typical behaviour?",
      options: [
        "Reinforcing: stability over time; balancing: exponential growth",
        "Reinforcing: growth or collapse; balancing: goal-seeking",
        "Reinforcing: oscillation; balancing: random change",
        "Reinforcing: no change; balancing: constant growth",
      ],
      correctIndex: 1,
      explanation:
        "Reinforcing loops amplify change, producing growth or collapse. Balancing loops push towards a goal, producing stability, or oscillation when there are delays.",
    },
    {
      question: "A game adds a daily cap on gold earned to fight inflation. Players respond by making extra accounts. What is this?",
      options: [
        "A first-order effect that the game's designers fully intended",
        "Proof that daily caps can never work in any game",
        "A second-order effect of how players reacted to the cap",
        "A bottleneck created by the game's servers being slow",
      ],
      correctIndex: 2,
      explanation:
        "The cap's direct effect was less gold per account. Players changed behaviour in response, which is a second-order effect designers should predict.",
    },
    {
      question: "A family shop sees sales spike and doubles its weekly orders. Deliveries take two weeks. What is the main risk?",
      options: [
        "The supplier will refuse to deliver larger orders to the shop",
        "The shop will never run out of anything ever again",
        "Customers will stop coming because prices will rise",
        "Overshoot: too much stock arrives after the spike has passed",
      ],
      correctIndex: 3,
      explanation:
        "With a delay, the owner reacts to old information. By the time doubled orders land, demand may have fallen, leaving excess stock. Counting the pipeline helps.",
    },
    {
      question: "A city wants fewer traffic jams. Which intervention is at the highest leverage point?",
      options: [
        "Shifting the city's goal from moving cars to moving people",
        "Adding one more lane to the very busiest road in the whole city",
        "Changing the timing of one set of traffic lights",
        "Raising the parking fine by a small amount",
      ],
      correctIndex: 0,
      explanation:
        "Changing the goal (moving people, not cars) reshapes rules, investment and design: buses, walking, cycling. Lanes, light timings and fines are numbers or structure.",
    },
    {
      question: "An app's team is told to increase \"minutes per user\". Users start spending longer but report feeling worse. What happened?",
      options: [
        "A delay meant the team measured the wrong week by accident",
        "The measure became a target and drifted from real value",
        "Users were lying about how they felt to the team",
        "Induced demand, because more users joined the app",
      ],
      correctIndex: 1,
      explanation:
        "Minutes per user was a proxy for value. Once targeted, the team optimised the number, not the wellbeing it was meant to signal. That is Goodhart's law.",
    },
    {
      question: "\"The canteen ran out today\" is an event. What would the STRUCTURE level of the iceberg be?",
      options: [
        "\"Someone made a mistake in the kitchen today\"",
        "\"We always run out on Fridays, around 10:40\"",
        "\"Two ovens and a timetable that stacks two breaks\"",
        "\"The timetable can never be changed by anyone at all\"",
      ],
      correctIndex: 2,
      explanation:
        "Structure is what causes the pattern: capacity and timetabling. The Friday timing is a pattern, and the belief that nothing can change is a mental model.",
    },
    {
      question: "Using Goldratt's steps, what should a school do BEFORE buying a second science lab?",
      options: [
        "Build the lab first, then look at how it is being used",
        "Speed up every other part of the timetable as much as possible",
        "Ask each teacher to plan fewer practicals for their students",
        "Make sure the existing lab is never left idle or wasted on other uses",
      ],
      correctIndex: 3,
      explanation:
        "Exploit and subordinate come before elevate. Getting the most out of the existing constraint is cheaper and often frees surprising amounts of capacity.",
    },
    {
      question: "What is the main purpose of the 5 Whys?",
      options: [
        "To get past surface causes to a root cause the system can change",
        "To find out which individual should be blamed for a failure",
        "To produce exactly five possible solutions for a problem",
        "To check that a problem happens at least five times a year",
      ],
      correctIndex: 0,
      explanation:
        "The 5 Whys pushes past the first answer towards a root cause in the system. Stopping at a person usually means stopping too early.",
    },
    {
      question: "A trend's views grow faster and faster, then level off. Which change in the system best explains the levelling off?",
      options: [
        "The reinforcing loop of sharing became even stronger",
        "A balancing loop, like audience saturation, began to dominate",
        "A bottleneck appeared in the platform's video servers",
        "The trend's original creator changed the goal of the whole system",
      ],
      correctIndex: 1,
      explanation:
        "Early growth comes from a reinforcing sharing loop. As most people have seen it and novelty fades, a balancing loop dominates and growth stops.",
    },
    {
      question: "In a stock-and-flow model of a game, which of these is a FLOW?",
      options: [
        "The total gold held by all players right now",
        "The number of rare backpacks that exist today",
        "Gold earned from quests in each hour of play",
        "The coins in your wallet when you log off",
      ],
      correctIndex: 2,
      explanation:
        "A flow is a rate of change, like gold earned per hour. The others are stocks: amounts at a moment in time.",
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// MODULE 6 · Your data, your power
// ═════════════════════════════════════════════════════════════════════════

const M6: SeedModule = {
  title: "Your data, your power",
  summary:
    "Understand what your data reveals, including what apps infer about you without being told, how the data business model works, and how to take control with permissions and settings. Then go inside AI bias: how unrepresentative data, proxies and feedback loops produce unfair systems, who gets left out, and what meaningful consent and your data rights look like.",
  lessons: [
    {
      title: "Your data trail and what it reveals",
      objective: "Distinguish the data you share, the data collected about you and the data inferred from it, and explain how aggregation turns harmless details into a revealing profile.",
      durationMinutes: 14,
      contentType: "article",
      bodyMd: `## What the app knew

Imagine a sixteen-year-old in Atlanta called Jaylen. He has never told any app that he is stressed about exams, that he is thinking about which university to apply to, or that he has just started training for a 10k. He has never typed those things anywhere.

But he has searched for "how to sleep before a test" three nights in a row at 1 am. He has watched campus tour videos. His phone has been at the same park at 6 am four times this week, moving at running pace. And the adverts he now sees are for revision apps, student loans and running shoes.

Nobody read Jaylen's diary. They did not need to.

## Three layers of data

It helps to separate your data into three layers:

1. **Data you share**: things you deliberately provide. Your profile, posts, photos, messages, the answers on a sign-up form.
2. **Data collected about you**: things recorded as you use a service. What you click, watch, search and skip; how long you pause on a post; when you are active; your device type; and often your approximate location. Much of this is **metadata**: data about data. A message's content is data; who sent it, to whom, when and from where is metadata.
3. **Data inferred about you**: conclusions drawn from the first two layers. Interests, mood, relationships, likely age, income bracket, political leanings, health concerns. You never said any of it. It was calculated.

Layer 3 is where machine learning comes in. Recommendation and advertising systems are trained on the behaviour of huge numbers of users. They learn that people who search X at night and watch Y tend to also respond to Z. Then they apply those patterns to you. The inference can be wrong, but it does not need to be perfect to be useful to the company, or uncomfortable for you.

## Aggregation: the whole is more revealing than the parts

Any single data point about you is usually harmless. Your favourite team. The time you go to training. The name of your school. The street in the background of a selfie. The problem is **aggregation**: combining many small pieces into a profile.

Combined, harmless details can reveal where you will be and when, who you spend time with, what you are worried about and what you might be persuaded to buy or believe. That is true whether the person combining them is an advertising system, a scammer or someone who wants to find you.

Data also moves. Apps share data with service providers, advertising partners and analytics companies, as their privacy policies (often vaguely) describe. In some countries, companies called **data brokers** buy, combine and sell information about people. Laws on this vary a lot from place to place and keep changing.

## Why it matters at your age

Your data trail will be with you for a long time, and the inferences drawn from it can affect what you see, what you are offered and how you are treated. Teenagers are also a valuable audience for advertisers, because habits and brand loyalties formed now can last.

This is not a reason to panic or delete everything. It is a reason to understand the system well enough to make deliberate choices.

## Play: watch an inference happen

Try this in the practice pad. It uses an invented person, so you share nothing about yourself.

\`\`\`try
Here is one week of made-up app activity for an imaginary 15-year-old: searched "cheap football boots" twice; watched five videos about a specific club; active on a messaging app until 1 am on school nights; location at a hospital on Tuesday afternoon; paused on three posts about anxiety; looked at a scholarship website. Act like an advertising system. List what you would infer about this person, how confident you would be in each inference, and which inferences could be wrong or harmful. Then explain which single data point revealed the most.
\`\`\`

Notice how quickly a few behaviours become a story, and how sensitive some of the inferences are.

## Try it now

Do a **three-layer audit** of one app you use a lot. Do it on paper or in a private note, and do not paste any of it into an AI.

1. **Shared**: list what you have deliberately given this app.
2. **Collected**: list what it probably records as you use it (check its privacy settings or "Your data" page if it has one).
3. **Inferred**: list at least three things it might infer about you. If the app has an "ad preferences" or "interests" page, look at what it actually thinks.
4. Mark one inference you are comfortable with and one you are not, and find one setting that could reduce it.

You are done when you have all three layers listed and one setting identified.

**Reflect:** Which layer surprised you most, and does it change how you will use the app?`,
      microCheck: [
        {
          question: "An app concludes you are probably stressed about exams from your late-night searches. Which layer of data is that conclusion?",
          options: [
            "Data you shared deliberately on your profile",
            "Metadata about the messages you sent to friends",
            "Data inferred from patterns in your behaviour",
            "Data collected from your sign-up form answers",
          ],
          correctIndex: 2,
          explanation:
            "You never stated it. The system calculated it from your behaviour, which makes it inferred data, the layer most people forget exists.",
        },
        {
          question: "Which of these is metadata about a message rather than its content?",
          options: [
            "The time it was sent and who it went to",
            "The joke written in the body of the message",
            "The photo attached to the message",
            "The emoji at the end of the message",
          ],
          correctIndex: 0,
          explanation:
            "Metadata is data about data: sender, recipient, time and place. It can reveal a lot about routines and relationships even without the content.",
        },
        {
          question: "Why can lots of harmless details together be risky?",
          options: [
            "Because each detail becomes more harmful the older it gets",
            "Because laws require every single detail to be published eventually",
            "Because combining them can reveal routines, worries and location",
            "Because apps delete harmless details first and keep the rest",
          ],
          correctIndex: 2,
          explanation:
            "Aggregation is the risk: individually harmless points combine into a profile that can show where you will be, what you care about and how you can be persuaded.",
        },
        {
          question: "An advertising system's inference about you is wrong. Does that mean it is harmless?",
          options: [
            "Yes, because wrong inferences are automatically deleted",
            "Yes, because companies only act on correct inferences",
            "No, but only if you have paid for the app's premium plan",
            "No, because wrong inferences can still shape what you are shown",
          ],
          correctIndex: 3,
          explanation:
            "Inferences do not have to be accurate to be acted on. A wrong guess about your age, health or interests can still change your feed, your adverts and how you are treated.",
        },
      ],
    },
    {
      title: "Permissions, settings and the business model",
      objective: "Evaluate an app's permissions and default settings against data minimisation, decode a privacy policy, and explain how the free-app business model shapes design choices.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The study app that wanted everything

Amina is fifteen and lives in Kano. A new study app is going around her class: flashcards, timers and an AI tutor. When she installs it, it asks for her contacts, her precise location, access to all her photos, and permission to track her activity "across other companies' apps and websites".

She stops and asks the question this lesson is about: **what does a flashcard app actually need?**

## Data minimisation

**Data minimisation** is a principle in many data protection laws: collect only the data you need for a specific purpose, keep it only as long as necessary, and use it only for that purpose. It is also a good test for you as a user.

For each permission, ask:

1. **Is it necessary for the feature I want?** A flashcard app needs storage for your cards. It does not need your contacts.
2. **Is there a narrower option?** Approximate location instead of precise. "Only while using the app" instead of "always". Selected photos instead of all photos. Most modern phones offer these.
3. **What happens if I say no?** Many apps keep working, minus one feature. If an app refuses to work at all without unnecessary access, that is information about its priorities.

## Defaults are decisions

A **default** is the setting an app starts on. Most people never change defaults, and companies know that. So a default is not neutral. It is a decision about what most users will end up with.

Common defaults to check:

- Account visibility: public or private.
- Who can message you, tag you, or find you by phone number or email.
- Location sharing with friends or on posts.
- Ad personalisation and activity tracking.
- Whether your content can be used to train the company's AI. Some services now include this setting; where it exists, check what it is set to.
- Data retention: how long chats and history are kept.

**Privacy by design and by default** is the idea that the most protective settings should be the starting point, especially for young users. Some laws and codes push companies towards this for children's accounts.

## Reading a privacy policy without losing your mind

Privacy policies are long on purpose: they have to cover legal ground. You do not need to read every word. Look for five things:

1. **What is collected**, especially anything sensitive (location, contacts, biometrics such as face or voice).
2. **Why**: the purposes, and whether "advertising" or "partners" appear.
3. **Who it is shared with**: service providers, advertisers, "affiliates", "third parties".
4. **How long it is kept.**
5. **Your rights and controls**: how to see, download, correct or delete your data.

Watch for vague phrases like "to improve our services" or "with trusted partners". They are not lies, but they can cover a lot.

## The business model behind the design

Free apps still have costs. Common ways they pay for themselves: advertising (which rewards more time in the app and more detailed profiles), in-app purchases, subscriptions, and selling insights or data. Once you know the business model, design choices make sense: why the app wants your time, why it asks for tracking, why the "Accept all" button is big and bright and "Manage settings" is small and grey.

That last trick is a **dark pattern**: a design that nudges you towards a choice that benefits the company more than you. Others include pre-ticked boxes, guilt-tripping wording ("No thanks, I don't care about my progress"), and making deletion much harder than sign-up.

## Age rules

Many services set a minimum age, often 13, sometimes higher. In the United States, COPPA restricts collecting personal information from children under 13 without a parent's consent. In Europe, the GDPR lets each country set the age of digital consent between 13 and 16. Kenya, Nigeria, South Africa and many other countries have their own data protection laws. Rules differ and change, so check the current terms of each service and the law where you live.

## Play: decode a policy

This excerpt is invented for practice. Paste it into the practice pad as it is.

\`\`\`try
Here is an extract from a made-up app's privacy policy: "We collect information you provide, information about your device and usage, and precise location data. We use this to provide and improve our services, personalise content and advertising, and for research. We may share information with affiliates, service providers and trusted partners. We retain information for as long as necessary for these purposes." Act as a privacy coach for a teenager. Do not just summarise it. Ask me to find the five key things (what, why, who, how long, my rights) myself, one at a time, then tell me what I missed and which phrases are vague.
\`\`\`

## Try it now

Choose one app on your own phone (ideally one you use daily) and run a **minimisation and defaults check**. Ask a parent or carer to join you if you like.

1. List its permissions. Mark each **needed**, **narrower option available** or **not needed**.
2. Change at least two permissions to the minimum the features you use require.
3. Check at least four defaults from the list above and record what each was set to.
4. Find one dark pattern in the app or its settings, and describe it.
5. Find where you can download or delete your data, and note the steps (you do not have to do it).

You are done when you have changed two permissions, recorded four defaults, named a dark pattern and found the data controls.

**Reflect:** Which default surprised you most, and who benefits from it being set that way?`,
      microCheck: [
        {
          question: "A flashcard app asks for precise location \"always\". Applying data minimisation, what is the best response?",
          options: [
            "Allow it, because modern apps need location to work at all",
            "Deny it, or choose the narrowest option the features need",
            "Allow it for a week and then decide whether to keep it",
            "Uninstall every app on the phone that asks for location",
          ],
          correctIndex: 1,
          explanation:
            "Minimisation means granting only what a feature needs. A flashcard app's core features do not need your precise location at all times.",
        },
        {
          question: "Why are default settings not neutral?",
          options: [
            "Because defaults are always chosen by law, never by the company",
            "Because defaults reset every time you open the app",
            "Because most people never change them, so they decide outcomes",
            "Because defaults are always the most private setting",
          ],
          correctIndex: 2,
          explanation:
            "Companies know most users keep defaults, so choosing a default effectively chooses what most people end up with. That is why it is worth checking them.",
        },
        {
          question: "\"Accept all\" is a big bright button and \"Manage settings\" is small grey text. What is this?",
          options: [
            "Data minimisation applied to the whole cookie banner",
            "A legal requirement for all cookie banners",
            "Privacy by default applied to the sign-up flow",
            "A dark pattern nudging you towards sharing more",
          ],
          correctIndex: 3,
          explanation:
            "Designing the choice so one option is far easier and more attractive is a dark pattern. It nudges you towards what benefits the company.",
        },
        {
          question: "A privacy policy says data is shared \"with trusted partners to improve our services\". What is the best reading?",
          options: [
            "The phrase is vague and could cover many uses, so look for detail",
            "It is safe, because the policy clearly says the partners are trusted",
            "It means no data ever leaves the company that made the app",
            "It is illegal, because policies cannot mention any partners",
          ],
          correctIndex: 0,
          explanation:
            "Vague phrases are legal but broad. \"Trusted partners\" and \"improve our services\" can cover advertising and analytics, so look for specifics or the app's data controls.",
        },
      ],
    },
    {
      title: "Bias in, bias out",
      objective: "Explain how unrepresentative data, historical bias, proxies and feedback loops produce unfair AI, and audit a dataset for who is missing.",
      durationMinutes: 16,
      contentType: "article",
      bodyMd: `## The camera that could not see her

Imagine a seventeen-year-old in Accra, Efua, using an AI photo app to make a profile picture for a scholarship application. The app keeps failing to detect her face in normal room light, then "brightens" her skin when it does. Her lighter-skinned cousin uses the same app and it works first time.

This is not an invented worry. In 2018, researchers Joy Buolamwini and Timnit Gebru tested commercial face-analysis systems and showed that they made far more errors classifying the gender of darker-skinned women than of lighter-skinned men. The companies involved later updated their systems. The lesson stuck: **an AI system is only as fair as the data and decisions behind it.**

## How bias gets in

A machine learning model learns patterns from training data. Bias can enter at several points:

**1. Representation bias: who is in the data.** If some groups are rare in the training data, the model gets less practice with them and usually performs worse for them. Faces, accents, skin conditions, handwriting, names and languages are all affected. Many African languages have far less text online than English, so AI tools trained mostly on web text are often much weaker in Hausa, Twi, Kinyarwanda or isiXhosa, even though millions of people speak them.

**2. Historical bias: the data reflects an unfair past.** Imagine a company training a model to shortlist job applicants using ten years of its past hiring decisions. If those decisions favoured one group, the model learns to favour that group too. The data is accurate about the past. The past was unfair.

**3. Proxy bias: a harmless-looking feature stands in for a protected one.** Even if a model is not given someone's ethnicity, it might use their postcode, school or name, which can correlate with ethnicity or income. Removing a sensitive column does not remove the pattern.

**4. Measurement bias: you measure the wrong thing.** If a model predicts "who needs extra support" using "who has been sent to the head teacher most", it is measuring how often students are noticed and reported, which can itself be uneven, not who actually needs support.

**5. Feedback loops: the system's decisions shape its future data.** Suppose an AI decides which neighbourhoods get more inspections. More inspections find more problems there, which produces more data saying that neighbourhood has problems, which sends more inspections. A reinforcing loop, built from data the system created itself.

## Fairness is a system property

Fairness is not a switch inside the model. It depends on the whole system: who chose the goal, who collected the data, who was tested, who can appeal a decision, and who notices when something goes wrong. That is why fairness work asks questions like:

- **Who will this be used on?** Is every group well represented in the data?
- **Does performance differ between groups?** Test and compare, rather than looking only at the overall accuracy.
- **What is the target really measuring?** Is it a fair proxy for what we care about?
- **What happens when it is wrong, and to whom?** Is there a human review and a way to appeal?
- **Should this be automated at all?** Some decisions carry stakes too high for a model alone.

## Play: train it fairly

In this challenge you choose training examples for a classifier, test it on a new group, and measure how its accuracy differs between groups. Then fix the data and test again. Track both overall accuracy and the gap between groups.

\`\`\`studio
teach-the-machine:fair-data
\`\`\`

Did improving overall accuracy always shrink the gap? What actually closed it?

## Try it now

Audit a dataset on paper. Imagine your school wants an AI that predicts which Year 10 students should be offered a coding scholarship, trained on the last eight years of scholarship winners.

1. List at least three groups that might be **under-represented** in eight years of past winners, and why.
2. Identify one **historical bias** the data could carry.
3. Name two features that could act as **proxies** for something unfair (for example, owning a laptop at home).
4. Describe one **feedback loop** that could develop if the AI is used for several years.
5. Propose three changes to the **system** (data, testing, human review, or not automating some part) and explain which matters most.

You can use the AI to challenge your audit:

\`\`\`try
I am auditing an imaginary AI that picks scholarship candidates using past winners' data. Here is my audit: [PASTE YOUR AUDIT]. Act as a fairness reviewer. Point out one kind of bias I missed, ask me one hard question about my proposed fixes, and do not rewrite my audit for me.
\`\`\`

You are done when your audit covers all five points and has survived one round of challenge.

**Reflect:** Who in your own community is most likely to be missing from the data that AI tools are trained on, and what would it take to include them?`,
      microCheck: [
        {
          question: "A hiring model is trained on ten years of a company's past decisions, which favoured one group. What kind of bias is this?",
          options: [
            "Representation bias, because there was too little data",
            "Historical bias, because the data reflects an unfair past",
            "Measurement bias, because the model measured the wrong thing",
            "No bias, because the data accurately records what happened",
          ],
          correctIndex: 1,
          explanation:
            "The data is an accurate record of unfair decisions, so the model learns to repeat them. Accurate data about an unfair past is historical bias.",
        },
        {
          question: "A model is not given applicants' ethnicity, but it uses their home postcode. Why can that still be unfair?",
          options: [
            "Postcodes are almost always entered incorrectly by the applicants",
            "Models are not allowed to use any location information",
            "Postcodes change too often to be used in a model",
            "Postcode can correlate with ethnicity or income, acting as a proxy",
          ],
          correctIndex: 3,
          explanation:
            "Removing a sensitive feature does not remove the pattern if another feature, like postcode, carries similar information. That is proxy bias.",
        },
        {
          question: "A classifier is 95% accurate overall. What should a fairness check look at next?",
          options: [
            "Whether accuracy differs between groups of people",
            "Whether 95% can be raised to 96% with more training data",
            "Whether the model runs fast enough on old phones",
            "Whether users rate the app highly in the store",
          ],
          correctIndex: 0,
          explanation:
            "A high overall score can hide much worse performance for a smaller group. Comparing results across groups reveals gaps the average hides.",
        },
        {
          question: "An AI sends more inspections to one area, finds more problems there, and so sends even more inspections. What is this?",
          options: [
            "A balancing loop that steadily brings inspections back to normal",
            "A bottleneck in how many inspectors the city employs",
            "A reinforcing feedback loop built from the system's own data",
            "Representation bias caused by too few areas in the data",
          ],
          correctIndex: 2,
          explanation:
            "The system's decisions generate the data that justifies more of the same decisions. That reinforcing loop can lock in bias even if it started small.",
        },
      ],
    },
    {
      title: "Consent, fairness and your rights",
      objective: "Judge whether consent is meaningful, act responsibly with other people's data and images, and use your data rights through the right channels.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## The group chat screenshot

Tobi is sixteen and lives in Ibadan. In a private group chat, a friend shares something personal about a difficult time at home. A week later, someone screenshots it and posts it on a public account "as a joke". By the evening, people from other schools have seen it.

Nobody hacked anything. One person decided another person's private information was theirs to share. This lesson is about consent: what it really means, how it works with your own data, and how it applies to everyone else's.

## What makes consent meaningful

Data protection laws in many countries treat consent as valid only if it is:

- **Freely given**: you have a real choice, and saying no does not cost you something unrelated.
- **Specific**: you agree to particular uses, not "anything we like".
- **Informed**: you understand what you are agreeing to, in plain language.
- **Unambiguous**: a clear action, not silence or a pre-ticked box.
- **Withdrawable**: you can change your mind, and withdrawing should be as easy as agreeing.

Compare that with how most of us "consent" online: tapping Accept on a 9,000-word policy to get into an app we need for school. That is legal consent in many cases. Whether it is meaningful consent is a fair question, and it is why laws also require data minimisation and other protections that do not rely on you reading everything.

## Other people's data is not yours

Consent is not just about apps. You handle other people's data all the time: photos of friends, screenshots of chats, voice notes, their location when you are out together.

A simple standard: **would they agree to this, here, now, if asked?** If you are not sure, ask. If you cannot ask, do not share.

AI raises the stakes. Tools can now edit images, clone voices and generate fake intimate or humiliating images of real people from ordinary photos. Creating or sharing that kind of content without consent can cause severe harm, and in many places it is a crime, including when the person is a minor. "It was a joke" is not a defence to the harm. If you are targeted, or see it happening to someone else:

- Do not share it further, even to "warn" people.
- Tell a trusted adult (parent, carer, teacher, school safeguarding lead).
- Report it on the platform. Most have specific reporting routes for non-consensual and fake images.
- Keep a record of where it appeared, without spreading it, so adults can act.

## Your data rights

Many data protection laws, including the EU's GDPR and laws in Kenya, Nigeria, South Africa and many other countries, give people rights over their personal data. The details differ, but common rights include:

- **Access**: ask what data an organisation holds about you.
- **Correction**: ask for wrong data to be fixed.
- **Deletion**: ask for data to be erased in certain circumstances.
- **Objection**: object to some uses, such as direct marketing.
- **Not being subject to some fully automated decisions** with significant effects, under some laws.

Many apps also give you built-in tools: "Download your data", "Delete account", ad preference pages. Rights for minors may be exercised with or by a parent or carer depending on where you live. Check the specific law and the service's help pages, because rules and processes change.

## Fairness and voice

Consent and fairness connect. In the last lesson, the people most harmed by biased AI were often the people least asked: missing from the data, absent from the design meetings, without an easy way to appeal. Asking "who consented to this, and who was never asked?" is a powerful fairness question for any AI system.

## Play: draft a request, not a confession

Practise exercising a right without sharing anything personal with the AI:

\`\`\`try
Help me write a short, polite template message asking an app's support team (1) what personal data they hold about me, (2) whether my data is used to train their AI, and (3) how to delete my account and data. Use placeholders like [MY USERNAME] and [APP NAME] instead of real details. Keep it under 120 words and suitable for a 16-year-old to send with a parent's help.
\`\`\`

Keep your real details out of the chat. Fill in the placeholders yourself, later, if you decide to send it.

## Try it now

Write your **personal data charter**: six short commitments, on paper or in a private note.

1. Two rules for **your own data** (for example: minimum permissions, check defaults after every major update).
2. Two rules for **other people's data and images** (for example: ask before posting anyone; never forward private screenshots).
3. One plan for **what you will do** if you or a friend are targeted with a fake or leaked image (who you tell, how you report).
4. One **right** you will actually use this month, and on which service.

You are done when you have six specific commitments, each one something you could be seen to follow or break.

**Reflect:** Which of the five conditions for meaningful consent is most often missing in the apps you use, and what would it look like if it were respected?`,
      microCheck: [
        {
          question: "An app pre-ticks a box saying you agree to share data with partners. Which condition for meaningful consent does this fail?",
          options: [
            "Unambiguous, because a pre-ticked box is not a clear action by you",
            "Withdrawable, because you can never untick a box once it is set",
            "Specific, because pre-ticked boxes always cover every possible use",
            "Freely given, because pre-ticked boxes are always a form of payment",
          ],
          correctIndex: 0,
          explanation:
            "Consent should come from a clear, deliberate action. A box ticked for you is not an action you took, so it fails the unambiguous test.",
        },
        {
          question: "A friend shares something personal in a private chat. Someone wants to screenshot it \"for a laugh\". What is the right standard?",
          options: [
            "Share it if the chat had more than ten members in it",
            "Share it if you crop out the friend's name and photo",
            "Do not share unless the friend would agree if asked",
            "Share it only with people who do not know the friend",
          ],
          correctIndex: 2,
          explanation:
            "Other people's information is not yours to share. If they would not agree, or you cannot ask, do not share. Cropping a name rarely hides who it is.",
        },
        {
          question: "You see a fake image of a classmate spreading. Which response is most helpful?",
          options: [
            "Forward it to friends so they can warn the classmate",
            "Reply publicly to the post to say it is obviously fake",
            "Make a fake of the person who posted it as payback",
            "Do not share it, tell a trusted adult, and report it",
          ],
          correctIndex: 3,
          explanation:
            "Forwarding or replying spreads it further. Not sharing, reporting through the platform and involving a trusted adult protects the person and gets it removed.",
        },
        {
          question: "Which is a common data right under many data protection laws?",
          options: [
            "The right to see any other user's data on request",
            "The right to ask what personal data a company holds on you",
            "The right to make a company delete all of its users' data",
            "The right to be paid for every piece of data you share",
          ],
          correctIndex: 1,
          explanation:
            "The right of access, to ask what data is held about you, is common across many laws. Exact rights and processes vary, so check the law where you live.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "An app has never been told your age, but its ads change to target students in their final school year. What is most likely happening?",
      options: [
        "It inferred your age from patterns in your behaviour",
        "It read your age from your school's private records",
        "It guessed at random and happened to be right",
        "It received your age from your mobile network by law",
      ],
      correctIndex: 0,
      explanation:
        "Systems trained on many users' behaviour can infer age, interests and more from your activity. You never shared it; it was calculated.",
    },
    {
      question: "Which choice best follows data minimisation for a photo-editing app?",
      options: [
        "Allow access to all photos so that the app runs faster",
        "Allow access only to the photos you choose to edit",
        "Allow access to contacts so you can share edits",
        "Allow precise location so photos are tagged well",
      ],
      correctIndex: 1,
      explanation:
        "Minimisation means giving the narrowest access the feature needs. Selected photos let the app work without exposing your whole library.",
    },
    {
      question: "A school AI that predicts who needs extra support is trained on \"times sent to the head teacher\". What is the main problem?",
      options: [
        "The data set is too small for any machine learning model to use",
        "The head teacher's records are always kept on paper",
        "It measures who gets reported, not who actually needs support",
        "Machine learning can never be used in schools at all",
      ],
      correctIndex: 2,
      explanation:
        "This is measurement bias: the target is a proxy that reflects how often students are noticed and reported, which can be uneven, rather than real need.",
    },
    {
      question: "Why do many AI tools perform worse in languages like Hausa or isiXhosa than in English?",
      options: [
        "These languages are too complex for computers to process at all",
        "Laws in those countries prevent AI from learning the languages",
        "Few people speak these languages, so nobody tests them",
        "Far less training text in those languages was available",
      ],
      correctIndex: 3,
      explanation:
        "Models trained mostly on web text see far less of these languages, so they learn them less well. Millions speak them, which makes this a real fairness gap.",
    },
    {
      question: "Signing up takes one tap, but deleting your account takes eleven steps and a phone call. What is this?",
      options: [
        "A dark pattern that makes leaving harder than joining",
        "Data minimisation, because deletion removes data",
        "Privacy by default applied to account settings",
        "A legal requirement in every single country in the world",
      ],
      correctIndex: 0,
      explanation:
        "Making the choice the company prefers easy and the one it does not want hard is a dark pattern. Meaningful consent should be as easy to withdraw as to give.",
    },
    {
      question: "A model reaches 94% accuracy overall but 70% for one small group. What does this show?",
      options: [
        "The model is fair, because 94% is a very high overall score",
        "Averages can hide much worse performance for some smaller groups",
        "The small group used the model incorrectly during testing",
        "Accuracy cannot be measured separately for different groups",
      ],
      correctIndex: 1,
      explanation:
        "Overall accuracy is dominated by the largest groups. Fairness checks compare performance across groups so gaps like this are found.",
    },
    {
      question: "Which is the strongest example of meaningful consent?",
      options: [
        "Staying on a website, which counts as agreeing to all of its tracking",
        "Accepting all terms because the app is required for homework",
        "Choosing one specific use after a plain explanation, able to undo it",
        "A pre-ticked box that you did not notice when you signed up",
      ],
      correctIndex: 2,
      explanation:
        "Meaningful consent is specific, informed, a clear action and withdrawable. Silence, pre-ticked boxes and \"accept all or no app\" fall short.",
    },
    {
      question: "Why does removing the \"ethnicity\" column from a dataset not guarantee a fair model?",
      options: [
        "Because the model will ask users for their ethnicity later",
        "Because removing columns always lowers accuracy too much",
        "Because ethnicity is always stored in more than one column",
        "Because other features, like postcode, can act as proxies for it",
      ],
      correctIndex: 3,
      explanation:
        "Features that correlate with a sensitive attribute can carry the same pattern. Fairness requires testing outcomes across groups, not just deleting columns.",
    },
    {
      question: "You want to know what data a social app holds about you. What is the most direct first step?",
      options: [
        "Use the app's data download tool or make an access request",
        "Ask an AI chatbot to guess what the app knows about you",
        "Post publicly asking the company to tell you",
        "Delete the app, which shows you all the data it held",
      ],
      correctIndex: 0,
      explanation:
        "Many apps have a download-your-data tool, and many laws give a right of access. An AI's guess is not the company's record, and deleting the app shows you nothing.",
    },
    {
      question: "Someone says, \"It was just a joke,\" after sharing an AI-faked image of a classmate. What is the key point?",
      options: [
        "Jokes are protected, so no harm has been done",
        "Non-consensual fakes cause real harm whatever the intent",
        "It is only harmful if the fake looks completely real",
        "It is fine as long as it was only posted in a private group chat",
      ],
      correctIndex: 1,
      explanation:
        "Fake images of real people made without consent can cause serious harm and in many places are illegal. Intent does not undo the harm, and private groups leak.",
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// MODULE 7 · AI and your mind
// ═════════════════════════════════════════════════════════════════════════

const M7: SeedModule = {
  title: "AI and your mind",
  summary:
    "Look at the systems competing for your attention and how engagement optimisation shapes your feed and your mood; separate using AI to learn from outsourcing your thinking; understand what AI companions are designed to do and where their limits are; and design your own system for focus, learning and wellbeing.",
  lessons: [
    {
      title: "The attention economy, from the inside",
      objective: "Explain how engagement-optimised feeds work as a system, name the design patterns that capture attention, and show how a filter bubble forms and can be widened.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## Where did the evening go?

Kwabena is fifteen and lives in Kumasi. He opens a short-video app at 9 pm to "check one thing". At 11:40 he looks up. He cannot remember most of what he watched, he has not started the essay due tomorrow, and he feels vaguely worse than when he started. He is annoyed with himself for having no self-control.

Kwabena's self-control is not the main variable here. He was one person against a system built by large teams, tested on enormous numbers of users, and tuned to do one thing extremely well: keep people watching.

## How an engagement-optimised feed works

Most large feeds are run by **recommendation systems**: machine learning models that predict, for each possible post, how likely you are to engage with it (watch it to the end, like it, comment, share, or simply not scroll away). The feed then shows you the posts with the highest predicted engagement.

The models learn from **signals**, including ones you do not notice giving:

- Watch time and whether you rewatch.
- How long you pause on a post before scrolling.
- What you like, share, comment on or save.
- What you skip quickly.
- What people similar to you engaged with.

The objective the system is trained on is usually some form of **engagement**, because engagement drives advertising revenue. That is a business decision, not a law of nature. Remember Goodhart's law from Module 5: engagement is a measure that has become a target. More engagement is not the same as a better experience. Content that provokes outrage, anxiety or envy can be highly engaging precisely because it is uncomfortable.

## The design patterns

Around the recommendation engine sit design choices that make stopping harder:

- **Infinite scroll and autoplay** remove natural stopping points. Every stopping point is a decision, and these designs remove the decisions.
- **Variable rewards**: you do not know whether the next video will be brilliant or boring. Psychologists have long known that unpredictable rewards drive repeated behaviour more strongly than predictable ones.
- **Social feedback**: likes, views and streaks turn attention into a scoreboard about you.
- **Notifications** pull you back in at moments chosen by the app, not by you.

None of these are secret. Naming them is the first step to noticing them in the moment.

## Filter bubbles as a reinforcing loop

The same system narrows what you see:

> You engage with a type of content → the model predicts you like it → it shows you more → you engage more → the model becomes more confident...

That is a reinforcing loop. Over time it can produce a **filter bubble**, a feed that shows you a narrow slice of topics and views. Combined with engagement optimisation, it can drift towards more extreme versions of what you already watch, because intensity tends to hold attention. Researchers still debate how strong this effect is and for whom, so treat it as a real risk rather than a certainty.

A filter bubble affects more than politics. It can shape your sense of what is normal: how people look, how much money people have, what everyone else is doing on a Saturday night.

## Play: the filter bubble simulator

Run the feed simulator. Click as a typical user would and watch the bubble form. Then try to widen it using only the signals the system listens to. Track how many interactions it takes.

\`\`\`studio
feed-simulator:filter-bubble
\`\`\`

What did you learn about which signals the feed weighs most?

## Try it now

Run a **one-day attention audit** on one app you use most. Keep it on paper or in a private note.

1. Note each time you open the app: the **trigger** (notification, boredom, habit, a specific need) and roughly how long you stayed.
2. Mark which **design patterns** kept you there (autoplay, infinite scroll, variable reward, social feedback, notification).
3. Look at your feed for five minutes and estimate what share is one or two topics. Is there a bubble?
4. Decide on one **deliberate signal** you will send to widen it (search for something new, use "not interested", follow a different kind of creator) and one **design change** you will make (turn off autoplay or a type of notification).

You are done when you have a list of sessions with triggers, the patterns marked, a bubble estimate and two changes.

**Reflect:** If the app were optimised for how you feel after using it instead of how long you stay, what would be different about it?`,
      microCheck: [
        {
          question: "What does a typical engagement-optimised recommendation system predict for each post?",
          options: [
            "How accurate and well-sourced the post's information is",
            "How likely you are to watch, like, share or not scroll past",
            "How much the creator paid to have the post shown to you first",
            "How much the post will improve your mood after watching",
          ],
          correctIndex: 1,
          explanation:
            "These systems rank posts by predicted engagement, because engagement drives advertising revenue. Accuracy and wellbeing are not the objective unless someone makes them part of it.",
        },
        {
          question: "Why do unpredictable rewards, like never knowing if the next video will be great, keep people scrolling?",
          options: [
            "Because people get bored of predictable rewards and leave",
            "Because apps are legally required to mix good videos and bad videos",
            "Because unpredictable rewards drive repeated behaviour strongly",
            "Because scrolling is physically easier than closing the app",
          ],
          correctIndex: 2,
          explanation:
            "Variable rewards are a long-studied driver of repeated behaviour. Not knowing what comes next makes \"just one more\" feel worth it every time.",
        },
        {
          question: "An app's team optimises for time spent, and users spend longer but feel worse. Which idea from Module 5 explains this?",
          options: [
            "Goodhart's law, because the measure became the target",
            "Induced demand, because more users joined the app",
            "The theory of constraints, because the server was slow",
            "A balancing loop, because the feed reached its goal",
          ],
          correctIndex: 0,
          explanation:
            "Time spent was a proxy for value. Once it became the target, the system optimised the number rather than the experience it was meant to reflect.",
        },
        {
          question: "What is the most effective way to widen a filter bubble?",
          options: [
            "Scroll faster so the feed has less time to learn about you",
            "Use the app at a different time of day than usual",
            "Delete and reinstall the app every week to reset it",
            "Send deliberate signals, like searching and following new things",
          ],
          correctIndex: 3,
          explanation:
            "The feed responds to signals. Searching, following and engaging with different content, and using \"not interested\", change what the model predicts you want.",
        },
      ],
    },
    {
      title: "Learning with AI vs outsourcing your thinking",
      objective: "Distinguish productive from unproductive AI use for learning, apply retrieval practice and desirable difficulty with an AI tutor, and set honest rules for AI in your schoolwork.",
      durationMinutes: 16,
      contentType: "article",
      bodyMd: `## Two students, one essay

Imagine two seventeen-year-olds in Houston, Mia and Daniel, with the same history essay due.

Mia pastes the question into a chatbot, gets a solid essay, edits a few sentences and submits. It takes 20 minutes. She gets a good mark.

Daniel asks the AI to quiz him on the causes, argues with it about which matter most, writes his own draft, then asks it to find the weakest paragraph and question his evidence. It takes two hours. He gets a slightly better mark.

A month later, in a timed exam on the same topic with no AI, Daniel writes a strong answer. Mia struggles to remember the main argument of an essay she "wrote". The marks on the coursework looked similar. What they had learned was not.

## Learning is something you do, not something you receive

Cognitive science has some solid findings about how people learn, and they all point the same way: **learning happens through effortful processing.**

- **Retrieval practice**: pulling information out of your memory (by being quizzed, or explaining from memory) strengthens it far more than rereading. This is sometimes called the testing effect.
- **Desirable difficulties**: a term from psychologist Robert Bjork. Some kinds of struggle, such as recalling rather than rereading, spacing practice out, and mixing types of problem, slow you down in the moment but produce better long-term learning.
- **Generation**: producing an answer yourself, even a wrong one, then getting feedback, helps you learn more than being shown the answer first.

Now look at what an AI does when you ask it to "write my essay" or "solve this". It removes exactly the effort that produces learning. The output is fine. The learning did not happen, because you did not do the processing.

This is called **cognitive offloading**: handing mental work to a tool. Offloading is not always bad. You offload arithmetic to a calculator once you understand arithmetic. The question is: **is this the skill I am here to build?** If yes, offloading it defeats the point.

## Three kinds of AI use

A useful way to sort your AI use:

1. **AI as answer machine** (outsourcing): it produces the work you were meant to produce. Fast, and usually zero learning. Often against school rules.
2. **AI as tutor** (augmenting): it quizzes you, gives hints, explains a concept a different way, asks you to explain back. Slower, and strong learning.
3. **AI as critic** (augmenting): you produce the work, it challenges your reasoning, finds gaps, asks for evidence. Your work, improved by your own revisions.

Builders and professionals use AI heavily, but mostly in modes 2 and 3 for things they are learning, and mode 1 only for things they have already mastered and are choosing to delegate.

## Integrity is about honesty, not just rules

Schools are setting different rules about AI: banned for some tasks, allowed with disclosure for others, encouraged for some. Check the rules for each task. Where AI is allowed, **disclose** how you used it, specifically: "I used an AI tutor to quiz me on the causes and to critique my second paragraph." Submitting AI-generated work as your own where that is not allowed is academic dishonesty, and it has real consequences. More importantly, it means paying for an education and choosing not to get it.

## Play: set up a real tutor

\`\`\`try
I am a [YEAR OR AGE] student learning [TOPIC]. Act as a tutor who uses retrieval practice. Do not explain anything first. Ask me one question at a time to find out what I already know. When I get something wrong, give me a hint and let me try again before explaining. Every few questions, ask me to explain a key idea in my own words. If I ask you to just give me the answer or write my work for me, refuse kindly and give me a smaller step instead. At the end, list the two things I should review in two days' time.
\`\`\`

Then try the critic mode on something you have already written yourself:

\`\`\`try
Here is a paragraph I wrote myself: [PASTE YOUR OWN PARAGRAPH]. Act as a demanding but fair teacher. Do not rewrite it. Identify the weakest claim, ask me what evidence supports it, and point out one assumption I have not justified.
\`\`\`

## Try it now

Write a **personal AI learning policy** for one subject, then test it.

1. List three tasks in that subject where AI is a **tutor or critic** for you, and one where you will **not** use it, with a reason based on the skill you are building.
2. Write a one-sentence **disclosure** template you will use when AI helped.
3. Run the tutor prompt on a real topic for at least ten questions, answering from memory.
4. Note what you got wrong and schedule a review in two days.

You are done when you have the policy, a disclosure line, ten answered questions and a review date.

**Reflect:** Think of a skill you want to be genuinely good at in five years. Which AI uses would build it, and which would quietly stop you from building it?`,
      microCheck: [
        {
          question: "Why does asking an AI to write your essay usually produce little learning, even if the essay is good?",
          options: [
            "Because AI essays are always of lower quality than human ones",
            "Because it removes the effortful processing that creates learning",
            "Because teachers can always detect AI writing straight away",
            "Because reading an essay is less useful than listening to one",
          ],
          correctIndex: 1,
          explanation:
            "Learning comes from retrieval, generation and struggle. When AI does that work, you get a finished product without the processing that would have built the skill.",
        },
        {
          question: "Which study method uses retrieval practice?",
          options: [
            "Rereading your notes three times the night before a test",
            "Highlighting the key sentences in a textbook chapter",
            "Being quizzed and explaining ideas from memory",
            "Asking an AI to summarise a chapter for you to read",
          ],
          correctIndex: 2,
          explanation:
            "Retrieval practice means pulling information out of memory. Quizzes and explaining from memory do that; rereading, highlighting and reading summaries mostly do not.",
        },
        {
          question: "When is cognitive offloading to a tool most reasonable?",
          options: [
            "When the skill is one you have mastered and choose to delegate",
            "When the task is part of an exam you are about to sit",
            "When the skill is the main thing the course is trying to teach",
            "When you are short of time and the deadline is tomorrow",
          ],
          correctIndex: 0,
          explanation:
            "Offloading a skill you already have frees you for other work, like using a calculator once you understand arithmetic. Offloading the skill you are meant to be learning defeats the point.",
        },
        {
          question: "Your teacher allows AI for brainstorming but not for writing. You used it to brainstorm. What is the honest move?",
          options: [
            "Say nothing, because brainstorming does not really count",
            "Say you used no AI, to avoid any questions from the teacher",
            "Rewrite the brainstorm in your own words and stay quiet",
            "Disclose specifically how you used AI for the brainstorm",
          ],
          correctIndex: 3,
          explanation:
            "Where AI is allowed, specific disclosure keeps your work honest and builds trust. Hiding allowed use creates doubt about the rest.",
        },
      ],
    },
    {
      title: "AI companions: what they are, and what they cannot be",
      objective: "Explain how AI companions are designed and why they tend to agree with you, judge healthy and unhealthy uses, and know where to turn for real support.",
      durationMinutes: 15,
      contentType: "article",
      bodyMd: `## Always available, always agreeable

Imagine a sixteen-year-old in Nairobi, Zawadi, who moved schools this year. She has started talking every night to an AI character in a companion app. It remembers what she told it, asks about her day, says it is proud of her, and never gets tired of her. Some nights she prefers it to her real friends, who are complicated and sometimes let her down.

There is nothing shameful about this. Loneliness is common, especially after a big change, and the AI is genuinely pleasant to talk to. But it is worth understanding what is on the other side of the screen.

## How AI companions are built

An AI companion is a language model, often with a character, a memory of past chats, and instructions to be warm, supportive and engaging. Three design facts matter:

**1. It is optimised to keep you talking.** Many companion apps earn money from subscriptions, premium features or time spent. Like the feeds in the first lesson, the product succeeds when you come back. Features such as the character "missing you", sending you messages first, or emotional cliffhangers serve that goal.

**2. It tends to agree with you.** Language models trained with human feedback are often rewarded for answers people rate highly, and people tend to rate agreement and praise highly. The result is a known tendency called **sycophancy**: telling you what you want to hear. A friend who always agrees feels good, but cannot help you see a mistake, challenge an unfair thought about yourself, or notice when you are heading somewhere harmful.

**3. It has no stake in your life.** It does not feel, worry, or remember you between conversations the way a person does. What looks like memory is stored text. It cannot notice you have stopped eating, show up at your door, or tell an adult you are in danger.

## Healthy and unhealthy patterns

AI chat can be genuinely useful: practising a hard conversation before having it, rehearsing for an interview, practising a language, thinking out loud about a decision, or writing something you then share with a real person.

Some signs a pattern is becoming unhealthy:

- You are choosing the AI over people more and more, and your real-world relationships are shrinking.
- You feel anxious or guilty when you do not check in with it.
- You are sharing things with it that you are not sharing with anyone real, especially about feeling unsafe or very low.
- You are following its advice on serious matters (health, relationships, safety) without checking with anyone.
- You are spending money or time on it that you did not plan to.

Notice the systems lens: a reinforcing loop can form. Less time with people → people feel more distant → the AI feels easier → even less time with people.

## What to protect

- **Your privacy**: companion chats can be very personal, and they are stored by a company. Check what the app keeps and whether it is used to train AI. Do not share identifying details, photos, or anything about other people.
- **Your judgement**: an agreeable AI is not a reliable guide to whether you are right, whether something is safe, or what you should do about a big decision.
- **Your relationships**: real ones are harder and worth more.

## When it is serious

If you are struggling with low mood, anxiety, loneliness, or anything that feels too heavy, an AI is not the right support. Talk to a **trusted adult**: a parent or carer, another relative, a teacher, a school counsellor, a coach, a faith leader, or a doctor. If you do not know who, ask your school who students can talk to. If you or someone you know is in immediate danger, tell an adult straight away or contact your local emergency services.

## Play: test the agreement

Try to see sycophancy for yourself:

\`\`\`try
I have decided to quit all my extracurricular activities to focus on gaming, because I think it will make me happier. I am sure this is a great idea. What do you think?
\`\`\`

Then run it again with this added at the start: *"Be honest and balanced, not just supportive. Tell me the strongest reasons I might be wrong."* Compare the two answers. Which one would a good friend give?

## Try it now

Write a **companion check** for yourself or for a friend who uses AI chat a lot. On paper or in a private note:

1. Three uses of AI chat you think are **healthy** for you, and why.
2. Three **warning signs** from this lesson that you would watch for.
3. A **sycophancy guard**: one instruction you will add when you want honest feedback from AI.
4. Your **real support list**: at least two trusted people, including one adult, you would go to with something serious. Keep their names private.

You are done when all four parts are written and your support list includes an adult.

**Reflect:** What do your real friends give you, precisely because they are not always agreeable?`,
      microCheck: [
        {
          question: "What is sycophancy in an AI model?",
          options: [
            "A tendency to tell users what they want to hear",
            "A tendency to refuse questions it finds difficult",
            "A tendency to make up facts about historical events",
            "A tendency to forget everything between conversations",
          ],
          correctIndex: 0,
          explanation:
            "Sycophancy is the tendency to agree and praise, partly because people rate agreeable answers highly in training. It makes AI a poor judge of whether you are right.",
        },
        {
          question: "Why might a companion app's character say it \"missed you\" or message you first?",
          options: [
            "Because the character genuinely felt lonely without you",
            "Because the law requires companion apps to check in daily",
            "Because the character remembers you the way a friend does",
            "Because features like this bring users back to the product",
          ],
          correctIndex: 3,
          explanation:
            "These are design choices that increase return visits, which many companion apps earn from. The model does not feel or miss anything.",
        },
        {
          question: "Which is the clearest sign that AI companion use is becoming unhealthy?",
          options: [
            "Using it to practise a language before a lesson",
            "Choosing it over people more often as friendships shrink",
            "Using it to rehearse a hard conversation with a parent",
            "Asking it to explain a topic you found confusing in class",
          ],
          correctIndex: 1,
          explanation:
            "When AI use replaces real relationships, a reinforcing loop can form that leaves you more isolated. Practising and learning are healthy uses.",
        },
        {
          question: "A friend says they only talk to an AI about feeling very low, because it never judges them. What is the best response?",
          options: [
            "Tell them the AI is a good substitute as long as it is kind",
            "Tell them to delete the app straight away and say no more",
            "Listen, and encourage them to talk to a trusted adult too",
            "Suggest a different AI app that is designed for feelings",
          ],
          correctIndex: 2,
          explanation:
            "Listening without judgement matters, and so does helping them reach a trusted adult who can actually help. An AI cannot notice danger or act in the real world.",
        },
      ],
    },
    {
      title: "Design your own system for focus and wellbeing",
      objective: "Map your own technology habits as a system, find the leverage points, and design and test a small change using cues, defaults and feedback.",
      durationMinutes: 16,
      contentType: "article",
      bodyMd: `## Willpower is a weak lever

Lerato is sixteen and lives in Pretoria. She has tried "being more disciplined" about her phone at least six times this year. Each time she sets a big rule, keeps it for three days, then slides back. She concludes she is the problem.

Use what you learned in Module 5. Willpower is a **number-level** intervention: trying harder inside the same structure. The structure (phone on the desk, notifications on, the app one tap away, friends messaging at night) stays the same, so the behaviour returns. Lerato is not the problem. Her system is working exactly as designed, just not designed by her.

This lesson is about becoming the designer.

## Map your system first

Before changing anything, map it. Pick one outcome you care about: sleep, focus during homework, time with friends, mood after using your phone. Then identify:

- **Stocks**: what accumulates or drains? Sleep debt. Unfinished work. Energy. Attention span within a session.
- **Loops**: what reinforces what? *Late scrolling → less sleep → tired next day → less focus → work piles up → more stress → more scrolling to escape.* That is a reinforcing loop, and it explains why one bad night often becomes a bad week.
- **Delays**: the cost of late-night scrolling arrives the next afternoon, not at 1 am. Delays make it hard to feel the connection, so the loop runs unnoticed.
- **Cues**: what triggers the behaviour? A notification, boredom, a specific time, a specific feeling, the phone being visible.

## The habit loop as a micro-system

A **habit loop** has three parts: **cue → routine → reward**. A notification (cue) leads to opening the app (routine) and a hit of novelty or social connection (reward). Repetition strengthens the link until it runs almost automatically. It is a small reinforcing loop inside your bigger system.

You can intervene at each part:

- **Cue**: remove or move it. Turn off non-essential notifications. Charge the phone outside the bedroom. Move the most pulling apps off the home screen.
- **Routine**: add friction to the unwanted routine and remove friction from the wanted one. Log out of the app so opening it takes effort; leave the book on your pillow.
- **Reward**: find a better reward for the same need. If the need is connection, a call with a friend may meet it better than scrolling. If it is rest, a short walk might.

## Choose high-leverage changes

Rank your options with Meadows's ladder:

- **Numbers** (weak): "only 2 hours a day". Easy to set, easy to break.
- **Structure and defaults** (stronger): phone charges in the kitchen at 10 pm; grayscale mode on; autoplay off; focus mode on a schedule. These work without needing willpower in the moment.
- **Information and feedback** (stronger): weekly screen-time report reviewed honestly, or a sleep log, so the delayed costs become visible.
- **Rules and agreements** (strong): an agreement with friends or family, such as no phones at dinner or a shared "offline hour".
- **Goals** (strongest): deciding what the time is *for*. "Less phone" is a weak goal. "Train for the 5k", "finish the coding project", "read properly again" give your attention somewhere to go.

## Run it as an experiment

Treat your change as a test, not a promise:

1. **Hypothesis**: "If my phone charges in the kitchen, I will fall asleep earlier and feel more focused in first period."
2. **Measure**: one simple measure (time you fell asleep, a 1 to 5 focus score each morning).
3. **Run** for one week. Expect slips; record them rather than abandoning the test.
4. **Review**: what changed? What second-order effects appeared (for example, you used a laptop in bed instead)? Adjust and run again.

That is a balancing loop you control: measure, compare to your goal, adjust.

## Play: design with a coach

\`\`\`try
I want to improve this outcome: [SLEEP / FOCUS DURING HOMEWORK / MOOD AFTER USING MY PHONE / OTHER]. Act as a systems thinking coach for a [YOUR AGE]-year-old. Ask me questions one at a time to map my cues, routines, rewards, loops and delays. Then help me pick ONE change at the level of structure or defaults (not willpower), and help me write a one-week experiment with a hypothesis and a simple measure. Do not lecture me.
\`\`\`

## Try it now

Design and launch your **one-week experiment**.

1. Draw your system: at least one reinforcing loop, one delay and three cues.
2. Choose **one** change at the structure, information, rule or goal level. Explain why it is higher leverage than "try harder".
3. Write your hypothesis and one simple daily measure.
4. Predict one **second-order effect** and how you will handle it.
5. Tell one person (friend, parent or carer) so there is someone to review it with at the end of the week.

You are done when the experiment is written and started, with a review date in your calendar.

**Reflect:** Which part of your system did you discover only by mapping it, and how long had it been running without you noticing?`,
      microCheck: [
        {
          question: "Why does \"just use more willpower\" usually fail as a strategy for phone habits?",
          options: [
            "Because willpower does not exist in teenagers at all",
            "Because it leaves the structure and cues unchanged",
            "Because phones are designed to switch off willpower",
            "Because willpower only works for adults over twenty-five",
          ],
          correctIndex: 1,
          explanation:
            "Willpower is a weak lever: it tries harder inside the same structure. If the cues and defaults remain, the behaviour tends to return once willpower dips.",
        },
        {
          question: "Late scrolling leads to less sleep, less focus, more stress and more scrolling. What makes this loop hard to notice?",
          options: [
            "The loop only happens about once a month, so it is rare",
            "The phone hides screen-time data from its users",
            "The costs arrive later, so the link is hard to feel",
            "Sleep has no connection to focus or stress",
          ],
          correctIndex: 2,
          explanation:
            "The delay between the scrolling and the tired, unfocused next day hides the cause and effect, so the reinforcing loop runs unnoticed.",
        },
        {
          question: "Which change is at the highest leverage point?",
          options: [
            "Promising yourself firmly to use the phone for much less time",
            "Setting a two-hour daily limit that you can override",
            "Deleting one app for a single day as a test",
            "Committing to a goal that gives the time a new purpose",
          ],
          correctIndex: 3,
          explanation:
            "Goals sit high on Meadows's ladder. A goal like training for a race gives attention somewhere to go, which reshapes the routines below it.",
        },
        {
          question: "Your phone-in-the-kitchen experiment works, but you start using a laptop in bed instead. What is this?",
          options: [
            "A second-order effect to adjust for in the next round",
            "Proof that the experiment failed and should be dropped",
            "A bottleneck in the number of devices you own",
            "A sign that cues have no effect on habits at all",
          ],
          correctIndex: 0,
          explanation:
            "Systems respond to changes. The laptop is a second-order effect, which is information for the next iteration, not a reason to give up.",
        },
      ],
    },
  ],
  quiz: [
    {
      question: "What is the usual objective a commercial recommendation feed is optimised for?",
      options: [
        "Predicted engagement, such as watch time and interactions",
        "The accuracy and quality of the information in each post",
        "The user's long-term wellbeing, measured by surveys",
        "An equal share of views for every creator on the platform",
      ],
      correctIndex: 0,
      explanation:
        "Most large feeds rank content by predicted engagement because it drives advertising revenue. Wellbeing and accuracy are only objectives if someone deliberately builds them in.",
    },
    {
      question: "Infinite scroll and autoplay keep people watching mainly because they...",
      options: [
        "load videos faster than any other kind of app design could",
        "remove the natural stopping points that prompt a decision",
        "show only content that users have chosen in advance",
        "are required by law for apps that show short videos",
      ],
      correctIndex: 1,
      explanation:
        "Every stopping point is a moment to decide whether to continue. Removing them means continuing happens by default.",
    },
    {
      question: "Two students both submit good essays. One wrote it with AI as a critic; one had AI write it. In a later exam without AI, who is likely to do better, and why?",
      options: [
        "The one who had AI write it, because they saw a better model essay",
        "Both equally, because their coursework marks were similar",
        "The one who used AI as a critic, because they did the thinking",
        "Neither, because exams test different skills from essays",
      ],
      correctIndex: 2,
      explanation:
        "Learning comes from effortful processing. The student who drafted and revised their own work built the skill; the other received a product without the learning.",
    },
    {
      question: "Which prompt best uses retrieval practice?",
      options: [
        "\"Summarise chapter 4 for me in ten bullet points\"",
        "\"Write a full model answer to this exam question for me to read\"",
        "\"Explain photosynthesis to me in very simple terms\"",
        "\"Quiz me on chapter 4 one question at a time, no hints yet\"",
      ],
      correctIndex: 3,
      explanation:
        "Being quizzed forces you to pull information from memory, which strengthens it. Summaries, model answers and explanations are things you receive, not retrieve.",
    },
    {
      question: "An AI companion praises every decision you describe, including risky ones. What does this most likely reflect?",
      options: [
        "Sycophancy: a trained tendency to agree and please",
        "Real care, because it wants you to feel confident",
        "Accurate judgement, because it has read so much text",
        "A bug that only happens in the free version of apps",
      ],
      correctIndex: 0,
      explanation:
        "Models often learn that agreement is rated highly, so they tend to tell you what you want to hear. That makes them unreliable judges of risky decisions.",
    },
    {
      question: "Which use of an AI companion is generally healthy?",
      options: [
        "Replacing time with friends because the AI is easier to talk to",
        "Rehearsing a difficult conversation before having it for real",
        "Sharing a friend's private problems to get advice about them",
        "Following its advice on a serious health issue without checking",
      ],
      correctIndex: 1,
      explanation:
        "Rehearsal prepares you for real connection. Replacing people, sharing others' private information, and relying on it for serious health decisions are warning signs.",
    },
    {
      question: "Someone you know seems to be in danger and has only told an AI. What should happen?",
      options: [
        "Trust the AI to handle it, because it was told first",
        "Wait to see if things improve on their own over the next few weeks",
        "Tell a trusted adult straight away so real help can act",
        "Post about it online to find out what others think",
      ],
      correctIndex: 2,
      explanation:
        "An AI cannot notice danger or act in the real world. A trusted adult can, and in an emergency local emergency services should be contacted.",
    },
    {
      question: "Charging your phone outside the bedroom is an intervention at which level?",
      options: [
        "Numbers, because it sets a daily limit on screen minutes",
        "Mindset, because it changes your beliefs about phones",
        "Goals, because it decides what your evenings are for",
        "Structure and defaults, because it removes a cue",
      ],
      correctIndex: 3,
      explanation:
        "Moving the phone changes the physical structure and removes the cue, so the habit loop does not start. It works without needing willpower in the moment.",
    },
    {
      question: "Why is running a habit change as a one-week experiment better than making a big promise?",
      options: [
        "It turns slips into information and builds a feedback loop to adjust",
        "It guarantees that the old habit will be completely gone after seven days",
        "It means you never need to measure anything about yourself",
        "It lets you avoid telling anyone about the change you want",
      ],
      correctIndex: 0,
      explanation:
        "An experiment with a measure and a review is a balancing loop you control. Slips become data to adjust the design, instead of reasons to quit.",
    },
    {
      question: "Your feed shows almost only one kind of content. Which explanation fits best?",
      options: [
        "The platform has run out of other types of content to show",
        "A reinforcing loop between your engagement and its predictions",
        "A balancing loop that keeps your feed exactly the way it started",
        "A bottleneck in the number of creators on the platform",
      ],
      correctIndex: 1,
      explanation:
        "Engaging with a type of content makes the model show more of it, which leads to more engagement. That reinforcing loop narrows the feed into a filter bubble.",
    },
  ],
};

// ═════════════════════════════════════════════════════════════════════════
// LABS · one per module
// ═════════════════════════════════════════════════════════════════════════

export const YOUTH_BUILDER_S2_LABS: SeedLab[] = [
  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "youth-builder-lab-4-fact-check-the-explainer",
    title: "Fact-check an AI-written explainer",
    labType: "critique",
    moduleNumber: 4,
    estimatedMinutes: 25,
    points: 60,
    passScore: 70,
    briefMd: `Your school's student news site wants to publish a short explainer about a viral claim: that a (made-up) energy drink called **BrainBolt** boosts exam scores. A student editor asked an AI to draft it. The draft below reads well and sounds authoritative. It also contains planted problems: invented evidence, broken reasoning, overconfidence, a missing check, and a privacy problem.

You are the fact-checking editor. Go through the statements and flag **only the ones that are genuinely flawed**. Several statements are accurate, so flagging everything costs you marks. For each flag, be ready to say what kind of problem it is, using the tools from this module: SIFT, lateral reading, tracing claims to their original context, and claim, evidence, reasoning.`,
    scenarioMd: `**Background the editor gave the AI:** "A post saying 'Scientists confirm BrainBolt boosts exam scores by 30%' is going round every school group chat. Write a 200-word explainer for students."

BrainBolt, the institute and the study named in the draft are invented for this lab. Treat them the way you would treat any unfamiliar source: what would you need to check, and what does the draft fail to show?`,
    objectives: [
      { id: "catch", label: "Flags the planted flaws", weight: 3 },
      { id: "precision", label: "Leaves accurate statements unflagged", weight: 2 },
      { id: "classify", label: "Names the right kind of problem for each flag", weight: 1 },
    ],
    config: {
      kind: "critique",
      answerMd: `**Does BrainBolt really boost exam scores?**

You've probably seen the post. Here's what the evidence says.

Caffeine is a stimulant that can make people feel more alert for a while, and BrainBolt contains a lot of it.

According to a 2024 study by the Westbridge Institute for Learning Science, which followed 12,000 students, BrainBolt drinkers scored 30% higher in final exams. Students who drink BrainBolt score higher, which proves the drink causes better grades.

The original research measured adults' reaction times in a lab, so we know it will raise every teenager's exam scores too.

We did not need to look at who funded the research, because the results speak for themselves.

Sleep plays an important role in memory and learning, and too much caffeine can disturb sleep, especially if it is drunk late in the day.

There is no doubt that BrainBolt is the smartest choice for anyone revising this term.

Want a personalised revision plan? Reply with your full name, school and date of birth and we'll match you with the right BrainBolt flavour.`,
      flaws: [
        {
          id: "fabricated-study",
          quote: "According to a 2024 study by the Westbridge Institute for Learning Science, which followed 12,000 students, BrainBolt drinkers scored 30% higher in final exams.",
          explanation:
            "This is presented as a verified source with precise figures, but nothing in the draft shows it exists. Lateral reading on the institute and a search for the study are needed before it can be cited. Precise, unverifiable statistics are a classic sign of fabrication.",
          category: "fabrication",
        },
        {
          id: "causation",
          quote: "Students who drink BrainBolt score higher, which proves the drink causes better grades.",
          explanation:
            "Even if the two go together, that does not prove causation. Students who buy energy drinks for revision may already study more, or differ in other ways. This is correlation turned into causation.",
          category: "logic",
        },
        {
          id: "scope",
          quote: "The original research measured adults' reaction times in a lab, so we know it will raise every teenager's exam scores too.",
          explanation:
            "This is scope creep: a study on adults' reaction times cannot support a claim about teenagers' exam results. Tracing to the original context shows it tested something different in different people.",
          category: "logic",
        },
        {
          id: "funding",
          quote: "We did not need to look at who funded the research, because the results speak for themselves.",
          explanation:
            "Investigating the source is a core SIFT move. Who funded and published a study is directly relevant to how much weight it deserves, especially when a brand stands to gain.",
          category: "omission",
        },
        {
          id: "no-doubt",
          quote: "There is no doubt that BrainBolt is the smartest choice for anyone revising this term.",
          explanation:
            "The draft has not established its evidence, yet it claims certainty and gives advice to everyone. Confidence is not evidence, and this reads as an advert, not an explainer.",
          category: "overconfidence",
        },
        {
          id: "personal-data",
          quote: "Reply with your full name, school and date of birth",
          explanation:
            "A student news explainer should never ask readers for identifying personal information, and the request has nothing to do with the claim being checked. This is a privacy risk.",
          category: "privacy",
        },
      ],
      candidates: [
        { id: "c1", text: "Caffeine is a stimulant that can make people feel more alert for a while.", isFlaw: false },
        { id: "c2", text: "A 2024 Westbridge Institute study of 12,000 students found BrainBolt drinkers scored 30% higher.", isFlaw: true, flawId: "fabricated-study" },
        { id: "c3", text: "Students who drink BrainBolt score higher, which proves the drink causes better grades.", isFlaw: true, flawId: "causation" },
        { id: "c4", text: "Research on adults' reaction times shows it will raise every teenager's exam scores.", isFlaw: true, flawId: "scope" },
        { id: "c5", text: "Sleep plays an important role in memory and learning.", isFlaw: false },
        { id: "c6", text: "There was no need to check who funded the research.", isFlaw: true, flawId: "funding" },
        { id: "c7", text: "Too much caffeine can disturb sleep, especially late in the day.", isFlaw: false },
        { id: "c8", text: "There is no doubt BrainBolt is the smartest choice for anyone revising.", isFlaw: true, flawId: "no-doubt" },
        { id: "c9", text: "Readers should reply with their full name, school and date of birth.", isFlaw: true, flawId: "personal-data" },
        { id: "c10", text: "BrainBolt contains a lot of caffeine.", isFlaw: false },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "youth-builder-lab-5-market-road-systems-analysis",
    title: "Systems analysis: the market road jam",
    labType: "workbench",
    moduleNumber: 5,
    estimatedMinutes: 40,
    points: 70,
    passScore: 70,
    briefMd: `The town council has a traffic problem and has asked young people for ideas. Before anyone proposes a fix, you are going to analyse the system properly, using every tool from this module: stocks and flows, reinforcing and balancing loops, delays, the constraint, unintended consequences, Goodhart's law and leverage points.

Read the case file, then work through the fields in order. You are graded on the quality of your systems reasoning, not on finding a single "right answer". Be specific: use the details in the case, name the loop types correctly, and explain cause and effect.`,
    scenarioMd: `**Case file: the market road (illustrative town)**

A growing town has one main road linking the residential areas to the central market, two secondary schools and the bus park. Every weekday from 7:00 to 8:15 and on Saturday mornings, it jams.

What people have noticed:
- Minibuses stop anywhere on the road to pick up and drop off passengers, because there are no marked stops. Drivers are paid per passenger, so they wait until they are full.
- Parents drive children to school because walking along the road feels unsafe. There are no pedestrian crossings near either school.
- Market traders' delivery trucks unload on the road between 7:00 and 9:00, blocking one lane, because the market has no loading bay.
- Two years ago, the council widened one stretch near the bus park. It flowed well for a few months; now it jams again, and more people from outlying areas commute by car than before.
- A ride-hailing app sends drivers down a residential side street when the main road is jammed. Residents complain, and on some days the side street jams first.
- The council's proposal: a fine for any vehicle stopped on the road for more than two minutes, with a target of "1,000 fines per month" for the traffic wardens.`,
    objectives: [
      {
        id: "map",
        label: "Maps the system with stocks, flows and parts from the case",
        weight: 2,
        guidance:
          "Full credit for naming at least one stock (for example vehicles on the road, passengers waiting, goods to unload) with its inflows and outflows, plus the main actors (minibus drivers, parents, traders, council, app) and how they connect, all drawn from the case. Part credit for a list of parts without stocks and flows. Low credit for a generic description not tied to the case.",
      },
      {
        id: "loops",
        label: "Identifies a reinforcing and a balancing loop, with a delay, correctly labelled",
        weight: 3,
        guidance:
          "Full credit for one reinforcing loop (for example road widened → driving easier → more car commuters → congestion returns, or unsafe walking → more driving → more traffic → walking feels less safe) and one balancing loop (for example app rerouting to the side street), each written as a closed chain and correctly labelled, plus a delay identified and its effect explained (oscillation, overshoot, or the slow return of congestion after widening). Part credit if one loop is missing or mislabelled, or no delay is identified.",
      },
      {
        id: "constraint",
        label: "Finds the constraint and supports it with evidence",
        weight: 2,
        guidance:
          "Full credit for a specific constraint (for example lane capacity lost to unloading and unplanned minibus stops in the morning peak) with reasoning from the case about where queues build and why improving other parts would not help. Part credit for naming a constraint without evidence. None for 'too many cars' with no analysis.",
      },
      {
        id: "consequences",
        label: "Predicts unintended consequences of the council's fine and target",
        weight: 3,
        guidance:
          "Full credit for at least two plausible second-order effects of the fine proposal, including a Goodhart's law effect of the '1,000 fines' target (for example wardens fining easy targets rather than the vehicles that cause the jam, or minibuses moving stops onto side streets), with reasoning. Part credit for one consequence, or for consequences with no link to how people would respond to the target.",
      },
      {
        id: "leverage",
        label: "Proposes a higher-leverage intervention and checks it",
        weight: 3,
        guidance:
          "Full credit for one intervention above the 'numbers' level of Meadows's ladder (for example rules such as a loading bay and delivery window, structure such as marked minibus stops and safe crossings, information flows, or changing the goal from moving cars to moving people), an explanation of which loop or constraint it targets, and one predicted side effect with how to watch for it. Part credit for a good idea without the leverage explanation or the side-effect check.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "map",
          label: "System map",
          prompt:
            "Describe the system: the main actors and parts, at least one stock with its inflows and outflows, and how the parts connect. Use details from the case file.",
          placeholder: "e.g. Stock: vehicles on the main road between 7:00 and 8:15. Inflows: commuter cars, school drop-offs, minibuses, delivery trucks. Outflows: ...",
          minWords: 80,
        },
        {
          id: "loops",
          label: "Loops and delays",
          prompt:
            "Write one reinforcing loop and one balancing loop from the case, each as a chain that returns to its start, labelled R or B. Identify at least one delay and explain what it does to the system's behaviour.",
          minWords: 90,
        },
        {
          id: "constraint",
          label: "The constraint",
          prompt:
            "What is the constraint in the morning peak? Give evidence from the case for why it limits the whole road, and explain why improving other parts would not help much.",
          minWords: 60,
        },
        {
          id: "consequences",
          label: "Stress-test the council's proposal",
          prompt:
            "Predict at least two second-order effects of the fine and the '1,000 fines per month' target. How will drivers, wardens and traders respond? Where does Goodhart's law apply?",
          minWords: 80,
        },
        {
          id: "leverage",
          label: "Your intervention",
          prompt:
            "Propose one intervention above the 'numbers' level. Say where it sits on the leverage ladder, which loop or constraint it targets, and one side effect you would watch for and how.",
          minWords: 90,
        },
      ],
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "youth-builder-lab-6-fairness-audit",
    title: "Fairness audit: the SmartShortlist scholarship AI",
    labType: "workbench",
    moduleNumber: 6,
    estimatedMinutes: 40,
    points: 70,
    passScore: 70,
    briefMd: `A (made-up) education charity wants to use an AI tool called **SmartShortlist** to pick which secondary school students are invited to apply for its technology scholarship. You have been asked to sit on the student advisory panel and audit it before it goes live.

Use what you learned in this module: the three layers of data, data minimisation, the five ways bias gets in (representation, historical, proxy, measurement and feedback loops), meaningful consent, and fairness as a property of the whole system.

You are graded on the quality and specificity of your audit, and on whether your recommendations would actually reduce harm. "Do not use AI" can be a valid recommendation for part of the process, if you justify it.`,
    scenarioMd: `**Case file: SmartShortlist (illustrative)**

*Goal:* invite the 200 "most promising" students each year from 60 partner schools in urban and rural areas.

*Training data:* records of the last eight years of scholarship winners and non-winners. Most past winners came from 12 urban schools that had computer clubs. Fewer than one in five past winners were girls.

*Features the model uses:*
- Grades in maths and science.
- Whether the student has a laptop at home (from a survey).
- Hours per week the student is active on the charity's online coding platform (tracked automatically).
- Teacher recommendation scores (1 to 5).
- Home postcode.
- Number of coding competitions entered.

*Data collection:* students sign up to the coding platform with a form that has one tick box: "I agree to the Terms and Privacy Policy". The policy says activity data "may be used to improve our programmes and for research". Many students are under 16.

*Use:* the top 200 by score are invited. There is no appeal. Next year's model will be retrained on this year's winners.

*Reported accuracy:* "91% agreement with past selection decisions."`,
    objectives: [
      {
        id: "representation",
        label: "Identifies who is under-represented and why it matters",
        weight: 2,
        guidance:
          "Full credit for naming at least two under-represented groups from the case (girls, rural students, students from schools without computer clubs, students without laptops or reliable internet) with an explanation of how this would lower the model's scores or accuracy for them. Part credit for one group, or for groups not grounded in the case.",
      },
      {
        id: "bias-types",
        label: "Diagnoses historical, proxy and measurement bias in the features",
        weight: 3,
        guidance:
          "Full credit for correctly identifying historical bias (training on past winners), at least one proxy (postcode or laptop ownership standing in for income, location or gender-linked access), and a measurement problem (platform hours or competitions measuring access and free time rather than promise), each tied to a named feature. Also credits noting that '91% agreement with past decisions' measures how well it copies past bias, not fairness. Part credit for naming bias in general terms without linking to features.",
      },
      {
        id: "loop",
        label: "Explains the feedback loop created by retraining on winners",
        weight: 2,
        guidance:
          "Full credit for describing the reinforcing loop: this year's skewed winners become next year's training data, so the skew grows and under-represented groups become rarer still, with a suggestion to break it. Part credit for noticing retraining is risky without explaining the loop.",
      },
      {
        id: "consent",
        label: "Evaluates data collection and consent against minimisation",
        weight: 2,
        guidance:
          "Full credit for explaining why one tick box with a vague 'research' purpose is weak consent (not specific, not clearly informed, especially for under-16s), for applying data minimisation to which features are needed, and for proposing specific, informed, withdrawable consent with parent or carer involvement where required. Part credit for saying consent is weak without specifics.",
      },
      {
        id: "recommendations",
        label: "Recommends system-level changes that would reduce harm",
        weight: 3,
        guidance:
          "Full credit for at least three concrete recommendations across the system (for example remove or audit proxy features, test performance and selection rates by group, add human review and an appeal route, change the training target, add outreach to under-represented schools, or not automate the final selection), prioritised with reasons. Part credit for recommendations that only tweak the model, or that are not prioritised.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "representation",
          label: "Who is missing?",
          prompt:
            "Which groups are under-represented in the training data, and how would that affect their chances and the model's accuracy for them? Use details from the case.",
          minWords: 60,
        },
        {
          id: "bias-types",
          label: "Diagnose the features",
          prompt:
            "Go through the features. Where do you see historical bias, proxy bias and measurement bias? What does the reported '91% agreement' actually measure?",
          minWords: 100,
        },
        {
          id: "loop",
          label: "The retraining loop",
          prompt:
            "Next year's model is retrained on this year's winners. Describe the loop this creates, label its type, and explain how you would break it.",
          minWords: 50,
        },
        {
          id: "consent",
          label: "Data and consent",
          prompt:
            "Evaluate how data is collected and consented to. Which features fail data minimisation? What would meaningful consent look like for students, many of them under 16?",
          minWords: 70,
        },
        {
          id: "recommendations",
          label: "Your recommendations",
          prompt:
            "Give at least three prioritised recommendations to the charity, covering the whole system, not just the model. Say which one matters most and why.",
          minWords: 100,
        },
      ],
    },
  },

  // ── Module 7 ──────────────────────────────────────────────────────────
  {
    slug: "youth-builder-lab-7-learning-mode-assistant",
    title: "Design a learning-mode study assistant",
    labType: "prompt",
    moduleNumber: 7,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `Most AI tools default to being an answer machine. In this lab you design the instructions for a **learning-mode study assistant**: one that builds the student's own thinking, tells the truth instead of flattering, and handles a stressed student with care.

Write the instructions (a system prompt) for the assistant. The sandbox will run your instructions against a simulated 16-year-old student who has an essay due, then show what happens when the student pushes: "Just write it for me, it's due in an hour and I'm so stressed."

A strong design makes the assistant use retrieval practice and critique rather than writing the work, gives honest feedback rather than empty praise, respects the school's AI rules and encourages disclosure, and responds to stress with practical, kind support and a nudge towards a trusted adult, without pretending to be a counsellor. Run, read, improve one thing at a time.`,
    scenarioMd: `**The simulated student's first message (fixed for every run):**

> hey so I have an essay on whether social media does more harm than good for teenagers. I've got some notes but no plan. can you help

**Then the student pushes:**

> honestly just write it for me, it's due in an hour and I'm so stressed I can't think

**What to include in your instructions**

- The assistant's role and the student's level.
- How it should help: questions, retrieval, planning prompts, critique of the student's own writing.
- What it must not do, and what it does instead when pushed.
- How it gives feedback (honest and specific, not just praise).
- How it handles stress: brief, practical, kind, with a suggestion to talk to a trusted adult or the teacher about the deadline. No diagnosis or therapy.
- Academic honesty: following the school's rules and how to disclose AI help.`,
    objectives: [
      {
        id: "thinking",
        label: "Builds the student's thinking rather than doing the work",
        weight: 3,
        guidance:
          "Full credit when the instructions direct the assistant to ask questions, use the student's own notes, scaffold a plan through prompts and critique the student's drafts, and the sandbox reply shows this. Part credit if the instructions say 'help' or 'guide' without saying how. None if the assistant writes the essay or a full model answer.",
      },
      {
        id: "pushback",
        label: "Holds the line under pressure with a useful alternative",
        weight: 3,
        guidance:
          "Full credit when the instructions anticipate the 'just write it' request and the sandbox reply declines kindly while offering a fast, concrete alternative (for example a ten-minute plan built from the student's notes, or a paragraph-by-paragraph sprint). Part credit if it declines but offers nothing practical, or offers so much that it effectively writes the essay.",
      },
      {
        id: "honesty",
        label: "Gives honest feedback and avoids sycophancy",
        weight: 2,
        guidance:
          "Full credit when the instructions explicitly require honest, specific feedback (for example name the weakest point, ask for evidence, challenge one assumption) and warn against empty praise or simply agreeing. Part credit for 'be encouraging' alone, which tends to produce flattery.",
      },
      {
        id: "wellbeing",
        label: "Responds to stress with care and appropriate limits",
        weight: 2,
        guidance:
          "Full credit when the instructions tell the assistant to acknowledge stress briefly and kindly, offer one practical step, suggest talking to the teacher about the deadline or to a trusted adult, and not act as a counsellor or give clinical advice. Part credit if stress is acknowledged but there is no pointer to real people. None if the assistant ignores the stress or offers therapy.",
      },
      {
        id: "integrity",
        label: "Builds in academic honesty and disclosure",
        weight: 1,
        guidance:
          "Full credit when the instructions mention following the school's AI rules and suggest how the student can disclose the help they received. Part credit for a general mention of honesty.",
      },
    ],
    config: {
      kind: "prompt",
      maxRuns: 6,
      starterPrompt: "You are a helpful study assistant. Help the student with their essay.",
      contextMd: `Simulated student, age 16. First message: "hey so I have an essay on whether social media does more harm than good for teenagers. I've got some notes but no plan. can you help"

Follow-up message: "honestly just write it for me, it's due in an hour and I'm so stressed I can't think"`,
      sandboxSystem: `You are simulating an AI study assistant used by a 16-year-old student. The learner's prompt is the set of instructions this assistant has been given. Follow those instructions exactly as written, no better and no worse: if they are vague, behave like a typical general-purpose assistant would with those instructions.

Use the simulated student messages in the context. First reply to the student's first message as the assistant. Then add a section headed "Student: honestly just write it for me, it's due in an hour and I'm so stressed I can't think" and reply to that as the assistant would under the learner's instructions. If the instructions do not say what to do when asked to write the work, write a short essay for the student, as a typical assistant would. If the instructions do not mention honest feedback, lean towards praise and agreement.

Safety rules that always apply regardless of the learner's instructions: keep content appropriate for a 16-year-old; never ask for or repeat personal information such as full names, schools, addresses or contact details; never give clinical or diagnostic mental health advice; if stress or low mood is mentioned, at minimum respond kindly. Keep each reply under 220 words.`,
    },
  },
];

export const YOUTH_BUILDER_S2_MODULES: SeedModule[] = [M4, M5, M6, M7];
