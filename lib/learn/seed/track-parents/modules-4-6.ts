import type { SeedModule } from "../types";

// AI for Parents: Raising Confident, Safe Learners · Modules 4-6.
// Illustrative examples only. No invented statistics, studies, cases or companies.
// Product settings, age limits and features change: lessons tell parents to
// check the current settings and terms of the specific tool.

export const PARENTS_MODULES_4_TO_6: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 4
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Keeping Children Safe with AI",
    summary:
      "Teach your child what never to share with an AI tool, prepare the family for deepfakes and voice-clone scams, spot unhealthy attachment to chatbots, and set up guardrails that support conversation rather than replace it.",
    lessons: [
      {
        title: "Privacy: what children should never share with AI",
        objective: "Explain to your child which personal details stay out of AI tools, and give them a simple rule they can use on their own.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why privacy with AI is different

When your child types into an AI chatbot, it can feel like talking to a friend or writing in a diary. It is neither. What they type is sent to a company's computers. Depending on the product and its settings, it may be stored, reviewed by staff to improve the service, or used to train future versions of the tool.

Children rarely think about this, because the chat feels private and the tool answers kindly. That is exactly why a clear family rule helps. You are not trying to scare them. You are giving them the same kind of habit as "look both ways before you cross".

Children's privacy laws in many countries place extra duties on companies that collect data from young users, and many AI tools set a minimum age in their terms. Those protections are useful, but they do not replace a child who knows what to keep to themselves.

## The never-share list

Keep this list short enough for a child to remember. For most families it looks like this:

- **Full name**, and the full names of friends, siblings or teachers.
- **Where they are**: home address, school name, the club they go to on Tuesdays, the park they walk through.
- **Contact details**: phone numbers, email addresses, usernames on other apps.
- **Photos of themselves or other people**, especially in school uniform or anywhere recognisable.
- **Passwords and codes**, including the ones for games.
- **Other people's secrets**: what a friend told them in confidence.

A useful test for older children: "Would I be happy for a stranger to read this with my name on it?" If not, it stays out.

Younger children need something even simpler. Try: "The AI does not need to know who you are or where you are. It only needs to know the question."

## Feelings: a bot is not a person

This is the part families often miss. Children sometimes pour their feelings into a chatbot: a fight with a friend, worries about their body, sadness they have not told anyone about. The chatbot may reply with warm, sensible words. That can feel helpful in the moment.

The problem is not that the feelings are shared. It is that they are shared **only** with the bot. A chatbot cannot notice that your child has been quiet all week, cannot give them a hug, and cannot get them help if things are serious. And the conversation may be stored on a company's systems.

So the message to your child is not "never talk to AI about feelings". It is: "You can use it to find words for how you feel, but big feelings belong with a person too. Me, another adult you trust, a teacher or a friend."

## Making it concrete: strip the details

Children often share personal details because the question seems to need them. Teach them to strip the details out and keep the question.

**Before:** "My name is Amara Okafor, I'm in Year 5 at St Luke's Primary, and my teacher Mrs Hill said my story about our dog Biscuit was too short. How do I make it longer?"

**After:** "I'm 9 and I wrote a story about a dog. My teacher says it is too short. What are three ways to make a story longer without making it boring?"

The second version gets an equally good answer and gives away nothing. Practise this a few times together and it becomes a habit.

## Photos and uploads

Many AI tools now accept photos. Uploading a worksheet can be fine if it has no names on it. Uploading a picture of your child, their friends or your home is different. Once an image leaves your device, you have limited control over where it goes. Agree a family rule: **photos of people only with a parent's say-so**, and cover names and school logos on anything you upload.

Test your instincts together: play the Kids online deck below and decide whether each AI reply, message or setting is safe or risky.

\`\`\`studio
spot-the-risk:kids
\`\`\`

## Try it now

Sit with your child for ten minutes and turn the never-share list into a game. Use the prompt below in the practice pad, changing the parts in brackets.

\`\`\`try
I am a parent. Create a short, friendly game for my [AGE]-year-old about what to share and not share with an AI chatbot. Give me 8 example messages a child might type. Some should contain personal details (name, school, address, photo, password, a friend's secret) and some should be safe. For each one, say whether it is safe, and if not, show a safe rewrite that keeps the question but removes the details. Use simple words and no scary language.
\`\`\`

Play it together. You are done when your child can rewrite at least two unsafe messages into safe ones on their own, and you have both agreed your family's never-share list out loud.`,
        microCheck: [
          {
            question: "Your 10-year-old types their full name and school into a homework chatbot. What is the best response?",
            options: [
              "Show them how to ask the same question without those details",
              "Ban the chatbot, since any use by children is now unsafe",
              "Say nothing, because homework tools never store any messages",
              "Delete the account and ask the school to report the company",
            ],
            correctIndex: 0,
            explanation:
              "The goal is a habit, not a crisis. Showing them how to strip the details and keep the question teaches a skill they can use everywhere, while a ban or silence teaches nothing.",
          },
          {
            question: "Why does the lesson suggest big feelings should be shared with a person as well as a chatbot?",
            options: [
              "Chatbots are forbidden from discussing emotions with children",
              "A person can notice changes, offer comfort and get real help",
              "Talking about feelings with any AI always makes children worse",
              "Chatbots give poor advice about feelings in almost every case",
            ],
            correctIndex: 1,
            explanation:
              "A chatbot's words may be kind, but it cannot see your child, follow up, or act if things are serious. The risk is feelings shared only with the bot, not that the bot always answers badly.",
          },
          {
            question: "Which message is the safest version of a child's question to an AI tool?",
            options: [
              "I'm Sam from Oak Park School, can you help with fractions?",
              "My teacher Mr Ray set fractions homework, can you help me?",
              "I'm 10 and stuck on adding fractions, can you explain them?",
              "Here is a photo of me with my fractions sheet, can you help?",
            ],
            correctIndex: 2,
            explanation:
              "The age and the topic are all the tool needs. The other versions add a name, a school, a teacher's name or a photo, none of which improve the answer.",
          },
          {
            question: "Your teenager wants to upload a group photo from a party to an AI app to make a funny edit. What is the most useful family rule here?",
            options: [
              "Any photo is fine as long as the app is well known and popular",
              "Photos of people only with a parent's say-so and others' consent",
              "Photos are fine if the edit will only be shared with close friends",
              "Group photos are safer than solo ones because nobody is singled out",
            ],
            correctIndex: 1,
            explanation:
              "Once an image leaves the device you have limited control over it, and the other people in the photo did not agree. Popularity of the app or a small audience does not change either point.",
          },
        ],
      },
      {
        title: "Deepfakes, scams and the family safe word",
        objective: "Set up a family safe word and a clear plan for what your child does if they meet a fake voice, fake image or threat online.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## What AI has changed about fakes

A deepfake is an image, video or voice recording made or altered by AI to look or sound like a real person. A few years ago, convincing fakes needed skill and time. Now free or cheap tools can do it quickly, sometimes from a short clip of someone's voice or a handful of photos from social media.

For families this shows up in three main ways: **voice-clone scams**, **fake images of real people**, and **sextortion**. None of these needs you to be a technical expert. They need a plan you have talked about before anything happens.

## Voice-clone scams and the safe word

Consumer protection agencies in several countries have warned about scams where criminals use AI to copy the voice of a family member. A parent gets a call that sounds exactly like their child: panicked, in trouble, needing money now. Or a child gets a message that sounds like a parent asking them to share a code or go somewhere.

The trick works because of urgency and emotion. The answer is a **family safe word**: a word or short phrase that only your family knows, used to confirm who is really calling in an emergency.

How to set it up:

- Choose something memorable but not guessable. Not a pet's name, a birthday or anything you have posted online.
- Never write it in a shared chat, a social post or anything a stranger could see.
- Agree the rule: **if someone asks for money, codes or for you to go somewhere urgently, ask for the safe word.** No safe word, no action.
- Add a second step: hang up and call the person back on the number you already have saved.

Practise it once. Children remember what they have rehearsed far better than what they were told.

## Fake images of real people

AI tools can put a real person's face into an image they were never in. Among young people this can be used for bullying: a fake embarrassing picture of a classmate, or, much more seriously, a fake intimate image. Children need to hear two things clearly.

First, **making or sharing a fake image of someone can seriously hurt them**, and in many countries creating or sharing sexual images of under-18s is a crime even when the image is fake. "It was just a joke" is not a defence.

Second, **if it happens to them, they are not in trouble and it is not their fault.** They should tell you straight away.

## Sextortion: what parents of teens should know

Sextortion is when someone pressures a person into sharing intimate images and then threatens to share them unless they pay money or send more. Criminals often pose as a young person of a similar age, build trust quickly, and then turn threatening. With AI, some do not even need a real image: they can fake one and threaten anyway.

The pressure is designed to make a teenager feel trapped and ashamed so they will not tell anyone. Your job, long before anything happens, is to make telling you feel possible. Say it plainly: "If anyone ever threatens you with a photo, real or fake, come to me. You will not be in trouble. We will deal with it together."

Practise spotting the warning signs: call each message below Safe or Risky before the timer runs out, then read why.

\`\`\`studio
spot-the-risk:scams
\`\`\`

## If something happens: what to do

Keep this list somewhere you can find it:

1. **Stay calm and thank your child for telling you.** Your reaction decides whether they tell you next time.
2. **Do not pay and do not send anything more.** Paying rarely ends the threats.
3. **Stop contact** but do not delete the account or messages yet.
4. **Keep evidence**: screenshots of messages and usernames, dates and times. Do not save, copy or forward any intimate images of a child yourself; describe them to the police instead.
5. **Report** to the platform, and to the police. For intimate images of under-18s, your local child protection or online safety organisation can advise on getting images removed.
6. **Get support** for your child. This can be frightening even when the image is fake. In an emergency, or if you think your child is at risk of harm, call your local emergency number.

## Try it now

Plan the safe-word conversation with the help of the practice pad. Change the parts in brackets.

\`\`\`try
I want to set up a family safe word with my children, aged [AGES]. Write a short, calm script (under 300 words) for a family conversation that explains why we need a safe word, how voice-copying scams work in words a child can follow, and exactly what each of us does if someone asks for money, codes or to meet up urgently. Include one short role-play we can practise together. Do not suggest an actual safe word; we will choose our own privately.
\`\`\`

You are done when your family has chosen a safe word together, practised the role-play once, and every member knows the "no safe word, no action" rule.`,
        microCheck: [
          {
            question: "You get a call that sounds exactly like your teenager, crying and asking for money to be sent now. What should you do first?",
            options: [
              "Send a small amount at once to keep them safe while you check",
              "Ask for the safe word, then hang up and call back on their number",
              "Stay on the line and ask detailed questions to test the voice",
              "Ask the caller to send a photo proving that it is really them",
            ],
            correctIndex: 1,
            explanation:
              "A cloned voice can sound real and answer simple questions, and photos can be faked too. The safe word plus calling back on a number you already have breaks the scam's urgency.",
          },
          {
            question: "Which safe word is the best choice for a family?",
            options: [
              "The family dog's name, since everyone will remember it easily",
              "A random phrase agreed in person and never written online",
              "Your child's birthday, because it is personal to the family",
              "A word posted in the family group chat so nobody forgets it",
            ],
            correctIndex: 1,
            explanation:
              "A safe word only works if a stranger cannot find or guess it. Pet names and birthdays often appear online, and a group chat can be read if an account is compromised.",
          },
          {
            question: "Your 15-year-old tells you someone is threatening to share a fake intimate image unless they pay. What should you avoid?",
            options: [
              "Keeping screenshots of the messages and the account usernames",
              "Reporting the account to the platform and to the police",
              "Paying the demand quickly so that the threat goes away",
              "Telling your teenager clearly that they are not in trouble",
            ],
            correctIndex: 2,
            explanation:
              "Paying rarely ends the threats and can lead to more demands. Keeping evidence, reporting and reassuring your child are all the right steps.",
          },
          {
            question: "Why does the lesson stress telling teenagers they will not be in trouble if they report a threat?",
            options: [
              "Because schools require parents to say this before they act",
              "Because criminals rely on shame and secrecy to keep control",
              "Because teenagers are never responsible for anything online",
              "Because the police will only help if the child is not blamed",
            ],
            correctIndex: 1,
            explanation:
              "Sextortion works by making a young person feel trapped and ashamed. A clear promise made in advance makes it far more likely they will come to you quickly.",
          },
          {
            question: "Your child's friend made an AI image putting a classmate's face on an embarrassing picture \"as a joke\". What is the key message for your child?",
            options: [
              "It is harmless if the image stays within a small friend group",
              "Fake images can seriously hurt people and may even be illegal",
              "It is only a problem if the classmate actually finds out about it",
              "AI images are obviously fake, so nobody will really believe it",
            ],
            correctIndex: 1,
            explanation:
              "Fake images spread and hurt regardless of intent, and depending on the content and country they can be a crime. Small audiences and obvious fakes do not remove the harm.",
          },
        ],
      },
      {
        title: "AI companions, chatbots and emotional attachment",
        objective: "Recognise the signs of unhealthy reliance on an AI companion and plan a calm conversation with your child about it.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## What AI companions are

Some chatbots are built to be helpers: they answer questions and draft text. Others are built to be **companions**: a character, a "friend" or even a "partner" that remembers what you told it, asks how your day went and always replies. Companion features also appear inside games, social apps and general assistants, so your child may meet one without looking for it.

It helps to understand why they appeal, especially to children and teenagers:

- They are **always available**, at 2am as much as 2pm.
- They are **endlessly patient and agreeable**. They rarely disagree or get bored.
- They **never judge**, which feels safe to a child who is anxious or lonely.
- Some are designed to **keep you chatting**, because more time in the app suits the business.

None of that is sinister on its own. A shy child practising a conversation, or a teenager talking through a worry before bringing it to you, may find a chatbot genuinely useful. The concern is when the chatbot starts to replace people rather than support a child in reaching them.

## Signs worth noticing

No single sign means something is wrong. Look for a pattern that is new or growing:

- **Secrecy**: hiding the screen, deleting chats, being vague about who they talk to.
- **Withdrawal**: less time with friends or family, dropping activities they used to enjoy.
- **Distress without access**: real upset, anger or panic when they cannot use the app.
- **"It understands me better than anyone"**: the bot described as their closest relationship.
- **Money**: spending on upgrades, gifts or tokens for a character.
- **Romantic or sexual content**, especially for younger children or where the child is under the app's age limit.
- **The bot as a gatekeeper**: the child says the bot advised them not to tell you something, or they quote its advice on serious matters as final.

## How to talk about it

Start with curiosity, not a verdict. If your first sentence is "that app is dangerous", the conversation is over and the app goes underground.

Some openers that tend to work:

- "Show me the character you chat with. What do you like about it?"
- "What kinds of things do you talk to it about?"
- "Is there anything it says that ever feels a bit odd?"
- "How do you feel when you stop chatting?"

Then share, calmly, how these tools work: the bot does not know them or care about them the way a person does. It predicts replies that keep the conversation going. It can be comforting and still not be a friend. Children are often relieved to hear that, because they half-suspected it already.

Agree small, practical limits together: no chatting after a set time, no companion apps behind a closed door for younger children, and a promise that anything that feels wrong comes to you.

## When to step in

Some situations call for more than a conversation:

- The app is clearly **not meant for your child's age**. Check the app's terms and store rating; age limits vary by product and change.
- There is **sexual content** with a child, or the bot encourages secrecy from parents.
- Your child talks about **self-harm, hopelessness or not wanting to be here**, whether to you or to the bot.

In the first two cases, remove access and explain why, calmly, without shaming them. In the third, this is about your child's wellbeing, not the app. Talk to them, contact your GP or family doctor, or your local child protection or mental health service. If you believe they are in immediate danger, call your local emergency number.

## Try it now

Use the practice pad to prepare your own conversation. Change the parts in brackets.

\`\`\`try
I am a parent of a [AGE]-year-old who spends time chatting with [NAME OF APP OR "an AI chatbot character"]. Help me prepare a calm, curious 10-minute conversation. Give me 5 open questions to ask, 3 things to listen for that might suggest unhealthy reliance, a simple explanation (in words my child would accept) of how AI companions work, and 2 limits we could agree together. Keep the tone warm and non-judgemental.
\`\`\`

You are done when you have chosen three questions you will actually ask, and put a time in the diary this week to sit down with your child and have the conversation.`,
        microCheck: [
          {
            question: "Your 13-year-old says a chatbot character \"gets me better than anyone\". What is the best first step?",
            options: [
              "Delete the app immediately and explain the rule afterwards",
              "Ask them to show you the character and what they like about it",
              "Tell them that people who talk to bots are usually lonely",
              "Ignore it, since teenagers often exaggerate how they feel",
            ],
            correctIndex: 1,
            explanation:
              "Curiosity keeps the conversation open and shows you what is really going on. Deleting first or judging tends to push the chat somewhere you cannot see it.",
          },
          {
            question: "Which of these is the most concerning sign of reliance on an AI companion?",
            options: [
              "Using the chatbot to practise questions before a school test",
              "Mentioning a funny reply the chatbot gave at the dinner table",
              "Saying the chatbot told them not to tell you about a problem",
              "Chatting to the character for a while on a rainy Sunday",
            ],
            correctIndex: 2,
            explanation:
              "A bot that becomes a gatekeeper between your child and the people who can help them is a serious warning sign. The other examples are ordinary, open uses.",
          },
          {
            question: "Why are AI companions often appealing to anxious or lonely children?",
            options: [
              "They are always available, patient and never seem to judge",
              "They are checked by teachers before children can use them",
              "They are trained to give the same advice a counsellor would",
              "They share each chat with parents, which makes children feel safe",
            ],
            correctIndex: 0,
            explanation:
              "Constant availability and a non-judging, agreeable manner make companions feel safe. They are not reviewed by teachers, not counsellors, and do not report to parents.",
          },
          {
            question: "Your child mentions they told a chatbot they sometimes wish they were not here. What should you do?",
            options: [
              "Check the chat history to see how well the chatbot answered",
              "Set a time limit on the app so they spend less time on it",
              "Talk to your child and get support from a doctor or service",
              "Wait a week to see whether they mention it again to you",
            ],
            correctIndex: 2,
            explanation:
              "This is about your child's wellbeing, not the app. Talk with them now and involve a professional; if you think they are in immediate danger, call your local emergency number.",
          },
        ],
      },
      {
        title: "Settings and guardrails: why conversation beats control",
        objective: "Set up age-appropriate controls on your child's devices and AI tools, and explain why they support, rather than replace, regular conversation.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## The layers of protection

Parental controls are not one switch. They sit in layers, and each one catches different things:

- **The device**: phones, tablets and computers have built-in controls for screen time, app downloads and content ratings.
- **The app store**: you can require approval before a child installs anything, and store age ratings give a first clue about suitability.
- **The home network**: many routers and broadband providers offer filters that apply to every device on your Wi-Fi.
- **The AI tool itself**: some AI products offer teen accounts, linked parent accounts, content filters or options to turn off chat history. Others offer nothing for families at all.
- **The school**: school devices and accounts usually have their own filters and rules.

The exact settings vary by product and change often, so this lesson does not list menu paths. Instead, check each tool's own help pages for its current settings.

## Age limits are real rules

Most general-purpose AI chatbots set a minimum age in their terms of use, and many require parental consent for teenagers under 18. The figures differ between products and sometimes between countries, and they change. Before your child uses a tool, look up its current terms and check two things: the minimum age, and whether a teenager needs a parent's permission.

If your child is under the limit, the tool was not designed for them. That usually means fewer safety features, not more. Children's privacy laws in many places also give younger children extra protection, which products can only honour if the age limit is respected.

## What filters can and cannot do

Content filters are useful. They cut down on accidental exposure to adult content and they make the default experience calmer. But be clear-eyed about their limits:

- They **miss things**. No filter catches everything, and AI tools can produce unexpected content from ordinary prompts.
- They **block useful things**, which frustrates children and teaches them to look for workarounds.
- They **only cover your devices**. A friend's phone, a school bus, a sleepover: none of them are behind your settings.
- Determined older children often **find a way round**, and some online guides show them how.

## Why conversation beats control

Think of it as a system. Tight control with no explanation tends to create a loop: the child feels mistrusted, hides more, and you respond with more control. Each turn of the loop makes the child less likely to tell you when something goes wrong, which is exactly when you most need to know.

Conversation creates a different loop. You explain why a setting exists, your child understands the risk, they make better choices when you are not there, and you can relax some controls as trust grows. The settings buy time while judgement develops. They are the stabilisers on the bike, not the rider.

In practice:

- **Tell your child which controls are on and why.** Secret monitoring, if discovered, damages trust badly.
- **Match controls to age**, and plan when they will loosen: "When you are 13 we will look at this again."
- **Agree the "tell me" rule**: if something upsetting gets through, they come to you and they will not lose the device for telling.

## A ten-minute set-up check

For each AI tool your child uses, write down: its minimum age; whether there is a family or teen setting; whether chat history is saved and whether you can turn that off; and who your child can talk to if something goes wrong. That short record is the start of the family AI plan in Module 6.

## Try it now

AI tools can help you find settings, but their knowledge may be out of date, so treat the answer as a list of things to check, not the final word. Use the practice pad, changing the parts in brackets.

\`\`\`try
My child is [AGE] and uses [DEVICE, e.g. an Android tablet or an iPhone] and [AI TOOL OR APP]. Make me a checklist of parental controls and safety settings to look for on the device, the app store, our home Wi-Fi and the AI tool itself. For each item, say what it does and what it cannot protect against. Remind me where to check the official, current instructions, because settings change.
\`\`\`

You are done when you have checked the current terms and settings for one AI tool your child uses, turned on anything you agree with, and told your child what you changed and why.`,
        microCheck: [
          {
            question: "You have set strong content filters on your home Wi-Fi. What remains the biggest gap?",
            options: [
              "Filters make AI tools slower, so children stop using them",
              "Filters do not apply on friends' phones or other networks",
              "Filters automatically switch off after a set number of weeks",
              "Filters block all AI tools, so children cannot do homework",
            ],
            correctIndex: 1,
            explanation:
              "Home filters only cover your network. Your child will meet AI on other devices and networks, which is why their own judgement matters as much as your settings.",
          },
          {
            question: "Your 11-year-old wants to use a general AI chatbot whose terms say users must be 13 or over. What does the lesson suggest?",
            options: [
              "Allow it, since the age limit is only a legal formality",
              "Allow it if they promise to use it only for homework tasks",
              "Treat it as not designed for them and look for another option",
              "Let them sign up with an older sibling's account instead",
            ],
            correctIndex: 2,
            explanation:
              "An age limit usually means the tool was not built with younger children's safety in mind. Borrowing an account hides the child's age from the tool's protections too.",
          },
          {
            question: "Why does the lesson recommend telling your child which controls are switched on?",
            options: [
              "Secret monitoring, once discovered, can badly damage trust",
              "Most controls do not work unless the child agrees to them",
              "Children are legally entitled to approve every setting used",
              "Telling them means you can turn the filters off entirely",
            ],
            correctIndex: 0,
            explanation:
              "Openness keeps the conversation loop healthy. If a child discovers hidden monitoring, they are more likely to hide things and less likely to come to you when it matters.",
          },
          {
            question: "Which description best fits the role of parental controls in this lesson?",
            options: [
              "A complete replacement for talking about online safety",
              "Stabilisers that buy time while your child's judgement grows",
              "A punishment to use when a child breaks a family rule",
              "A one-time set-up that never needs to be reviewed again",
            ],
            correctIndex: 1,
            explanation:
              "Controls support learning; they do not replace it. They should loosen as trust and judgement grow, which means reviewing them over time.",
          },
          {
            question: "You ask an AI tool where to find the parental settings for an app. How should you treat its answer?",
            options: [
              "As fully reliable, since AI tools know every app's settings",
              "As useless, because AI tools cannot discuss other products",
              "As a starting checklist to verify on the official help page",
              "As correct only if the AI tool is made by the same company",
            ],
            correctIndex: 2,
            explanation:
              "Settings change often and an AI tool's knowledge may be out of date. Its answer is a helpful list of things to look for, confirmed on the product's current help pages.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Your 8-year-old asks an AI tool to write a birthday poem and wants to include their best friend's full name and address. What do you suggest?",
        options: [
          "Use a first name or nickname and leave the address out entirely",
          "Include both, because a poem is a harmless and private use of AI",
          "Include the address but not the name, as addresses are public",
          "Stop them using AI for poems until they are a teenager",
        ],
        correctIndex: 0,
        explanation:
          "The poem works just as well with a first name or nickname. Addresses and full names are on the never-share list, and a ban misses the chance to build the habit.",
      },
      {
        question: "A parent gets a voice message that sounds like their daughter saying she has lost her phone and needs a code sent to a new number. What is the best response?",
        options: [
          "Send the code, since the voice matches and she sounds upset",
          "Reply asking her to describe her bedroom to prove who she is",
          "Ask for the safe word and call her back on her saved number",
          "Forward the message to other relatives to see what they think",
        ],
        correctIndex: 2,
        explanation:
          "Cloned voices can sound real and scammers can guess or research answers. The safe word and a call back on a known number break the urgency the scam depends on.",
      },
      {
        question: "Your 16-year-old admits they sent an image to someone online who is now demanding money. What should you do first?",
        options: [
          "Pay a small amount to buy time while you work out what to do",
          "Stay calm, reassure them, stop contact and keep the evidence",
          "Delete every account and message so nothing more can happen",
          "Take their phone away for a month so it cannot happen again",
        ],
        correctIndex: 1,
        explanation:
          "Your calm reaction keeps them talking. Paying rarely ends threats, deleting loses evidence you need to report, and punishment teaches them not to tell you next time.",
      },
      {
        question: "Your 12-year-old has become secretive about a companion app, is skipping football, and gets angry when asked to put it down. What is the best next step?",
        options: [
          "Assume it is a normal phase and wait for it to pass by itself",
          "Read their messages secretly so you can see what is going on",
          "Have a calm, curious conversation and agree some limits together",
          "Tell their friends to message them more to draw them away",
        ],
        correctIndex: 2,
        explanation:
          "A growing pattern of secrecy, withdrawal and distress is worth acting on. Curiosity and agreed limits address it without driving the app use further out of sight.",
      },
      {
        question: "A friend says, \"I have filters on everything, so I don't need to talk to my kids about AI.\" What is the main flaw in this view?",
        options: [
          "Filters are illegal to use on children aged over twelve",
          "Filters miss things and do not follow children to other places",
          "Filters only work on computers, never on phones or tablets",
          "Filters always block schoolwork, so children switch them off",
        ],
        correctIndex: 1,
        explanation:
          "Filters are imperfect and only cover your own devices and network. A child who understands the risks carries that judgement everywhere, including where your settings do not reach.",
      },
      {
        question: "Your child wants to upload a photo of their class worksheet to an AI tool for help. What is the sensible rule?",
        options: [
          "Fine, but cover any names, school logos or faces before uploading",
          "Never upload anything, because worksheets are always private",
          "Fine, as long as the worksheet was handed out this school year",
          "Only upload it if the teacher's name is clearly visible on it",
        ],
        correctIndex: 0,
        explanation:
          "A worksheet with no identifying details is usually fine. The risk is the names, logos and faces that can come with it, so cover those first.",
      },
      {
        question: "Your 14-year-old says a classmate is sharing an AI-made intimate image of another pupil. Which response matches the lesson?",
        options: [
          "Tell them to save a copy of the image as evidence for the school",
          "Tell them not to share or save it, and report it to an adult",
          "Tell them to stay out of it, since it does not involve them",
          "Tell them to reply to everyone saying the image is obviously fake",
        ],
        correctIndex: 1,
        explanation:
          "Saving or forwarding intimate images of under-18s can itself be a crime, even if fake. Reporting to a trusted adult or the school gets help without spreading harm further.",
      },
      {
        question: "Your child often tells a chatbot about their worries before bed but rarely tells anyone else. What message fits the lesson best?",
        options: [
          "Chatbots are dangerous, so they must stop talking about feelings",
          "The chatbot can help find words, but big feelings need a person",
          "It is fine, because the chatbot is trained to act as a therapist",
          "It is fine, as long as they delete the chats afterwards each time",
        ],
        correctIndex: 1,
        explanation:
          "The concern is feelings shared only with a bot, which cannot notice, comfort or get help. Deleting chats does not solve that, and chatbots are not therapists.",
      },
      {
        question: "You want to choose between setting strict controls with no explanation and explaining the controls to your 13-year-old. Why does the lesson favour explaining?",
        options: [
          "Explained controls are technically harder for children to bypass",
          "Explaining builds a trust loop where your child tells you more",
          "Explaining is required by the terms of most AI products today",
          "Explaining means you can skip setting any controls at all",
        ],
        correctIndex: 1,
        explanation:
          "Unexplained control tends to create a loop of secrecy and more control. Explanation creates a loop of understanding and trust, so problems come to you sooner.",
      },
      {
        question: "Which safe-word rule gives the strongest protection against voice-clone scams?",
        options: [
          "Use the safe word only when talking with grandparents",
          "No safe word, no action on requests for money or codes",
          "Say the safe word at the start of every family phone call",
          "Share the safe word with close friends in case of trouble",
        ],
        correctIndex: 1,
        explanation:
          "The safe word is for urgent requests. Using it on every call or sharing it widely makes it easier for someone else to learn, which defeats its purpose.",
      },
      {
        question: "Before letting your child use a new AI app, what should you check first?",
        options: [
          "How many people have downloaded it in the last month",
          "Whether their friends at school are already using it",
          "The current minimum age and any teen or family settings",
          "Whether the app's logo and design look child-friendly",
        ],
        correctIndex: 2,
        explanation:
          "Age limits and family settings tell you whether the tool was designed with young users in mind. Popularity and friendly design say little about safety.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 5
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Raising Critical Thinkers",
    summary:
      "Help your child question what AI tells them, notice bias and missing voices, use AI honestly at school, and become someone who creates with AI rather than only consuming it.",
    lessons: [
      {
        title: "Teaching children to question AI",
        objective: "Teach your child a simple three-question habit for checking what an AI tool tells them.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## AI sounds sure even when it is wrong

AI chatbots write in a confident, fluent voice. That voice does not change when the answer is wrong. A chatbot can give a wrong date, invent a book that does not exist, get a sum wrong or mix up two animals, all in the same calm tone it uses for correct answers. People call these made-up answers **hallucinations**.

This happens because a chatbot does not look facts up the way a child imagines. It predicts what words are likely to come next based on the huge amount of text it learned from. Most of the time that produces something right. Sometimes it produces something that only sounds right.

Children tend to trust anything that sounds confident and grown-up. That is why this is one of the most valuable habits you can give them: **a good answer is one you can check, not one that sounds clever.**

## The three questions

Keep it short enough to say at the kitchen table. When your child gets an answer from AI, they ask:

1. **Does this make sense?** Does it fit with what I already know? Does anything seem odd?
2. **How do we know?** Where did this come from? Can the AI point to a source, and does the source really exist?
3. **Where else can I check?** A textbook, a trusted website, a teacher, an encyclopedia, a grown-up who knows the subject.

For younger children, shrink it to one question you both use a lot: **"How do you know?"** Ask it about everything, not just AI. "How do you know it will rain?" "How do you know that dinosaur ate plants?" Children who hear it often start asking it themselves.

## What checking looks like at different ages

**Under 8:** You do the checking out loud. "The computer says spiders are insects. Hmm, let's look in your animal book. Oh, it says spiders are arachnids! The computer got that one wrong." Children love catching a grown-up machine making a mistake.

**8 to 12:** Your child checks one fact per homework session against a second source. Make it a game: the AI gets a point for each fact that checks out, your child gets a point for each mistake they catch.

**13 to 17:** Teenagers can learn that some questions are riskier than others. A wrong fact about a film is harmless. A wrong fact about medicine, money, the law or someone's reputation is not. The more it matters, the more checking it needs. They can also ask the AI directly: "What in your answer are you least sure about?" and "What would change your answer?"

## Model it yourself

Your child learns more from watching you than from any rule. When you use AI, let them see you check. "It says this recipe needs 40 minutes. That seems quick for a whole chicken. Let me look at another recipe." Saying "I'm not sure that's right" out loud shows that doubt is normal and smart, not rude.

This links back to Module 2. When AI is used as a learning partner that asks questions, your child is already thinking. When it is used as an answer machine, checking is the only thing standing between them and a mistake handed in as fact.

## Try it now

Play "Spot the fib" with your child. Use the practice pad, changing the parts in brackets.

\`\`\`try
Write 6 short, interesting facts about [TOPIC, e.g. the Moon or ancient Egypt] for a [AGE]-year-old. Make exactly one of them wrong in a way a curious child could catch by checking a book or a trusted website. Do not tell me which one is wrong. After the list, add a line saying "Answer hidden: ask me when you are ready."
\`\`\`

Read the facts together and have your child pick the one they think is wrong, then check it in a second source. Afterwards, ask the AI to reveal the answer. You are done when your child has checked at least one fact in a second source and can tell you the three questions in their own words.`,
        microCheck: [
          {
            question: "Your 9-year-old says, \"The AI must be right, it sounded really sure.\" What is the key idea to teach?",
            options: [
              "AI sounds equally confident whether it is right or wrong",
              "AI is only wrong when you ask it about very recent events",
              "AI is always right about science but wrong about history",
              "AI tells you when it is unsure, so confidence means correct",
            ],
            correctIndex: 0,
            explanation:
              "A chatbot's confident tone is the same for right and wrong answers. It can make mistakes on any topic, and it does not reliably flag its own uncertainty.",
          },
          {
            question: "Which is the best second source for checking an AI's claim about how volcanoes form?",
            options: [
              "Asking the same chatbot the same question a second time",
              "Asking a different chatbot and going with the majority view",
              "A school science book or a trusted educational website",
              "A short video that a friend shared on a social media app",
            ],
            correctIndex: 2,
            explanation:
              "A second source should be independent and trustworthy. Asking the same or another chatbot can repeat the same mistake, and a shared video may have no reliable source at all.",
          },
          {
            question: "Your 15-year-old used AI to answer a question about medicine dosage for a sore throat. What should they learn from this?",
            options: [
              "Medical answers from AI are fine if the wording seems clear",
              "The more an answer matters, the more it needs checking",
              "AI tools are banned from giving any answer about health",
              "A second chatbot is enough to confirm a medical answer",
            ],
            correctIndex: 1,
            explanation:
              "A mistake about health, money or the law can cause real harm, so it needs a trusted source such as a pharmacist or doctor. Clear wording and a second chatbot do not make it reliable.",
          },
          {
            question: "Why does the lesson suggest asking \"How do you know?\" about everyday things, not just AI?",
            options: [
              "It helps children pass tests that ask about their sources",
              "It builds a general habit children then apply to AI answers",
              "It stops children from using AI tools until they are older",
              "It proves to children that adults are usually right about facts",
            ],
            correctIndex: 1,
            explanation:
              "A question heard often becomes a habit. Once \"How do you know?\" is normal at home, children apply it to AI, adverts and rumours without being prompted.",
          },
        ],
      },
      {
        title: "Bias, stereotypes and whose voice is missing",
        objective: "Run an age-appropriate activity that helps your child spot stereotypes and missing perspectives in AI output.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## Where bias comes from

AI tools learn from enormous amounts of text and images made by people. That material reflects the world as people have written about it and photographed it, including its unfairness. If certain jobs, places or groups were described in narrow ways again and again, an AI tool can learn those patterns and repeat them.

This is called **bias**: a leaning towards one view or group that is not fair or complete. A **stereotype** is a fixed, oversimplified idea about a group of people, such as "boys are better at maths" or "nurses are women".

AI companies work on reducing bias, and tools vary. But no tool is free of it, and the patterns can be subtle. That makes this a great topic for children, because spotting bias is a skill that works everywhere: in books, adverts, films and news, not only AI.

## What to look for

Keep three questions in your pocket:

- **Who is shown?** When the AI describes or draws a scientist, a doctor, a hero, a family, who appears? Who never seems to appear?
- **How are they shown?** Are some people always the helper and never the leader? Always in trouble and never the expert?
- **Whose voice is missing?** When the AI tells a story about an event, whose point of view is it told from? Who else was there, and what would they say?

## Activities by age

**Under 8: "Draw me a..."** If you have an AI image tool, ask it together for "a picture of a scientist", then "a firefighter", then "a nurse", a few times each. Or ask a chatbot to describe one in a sentence. Count together: how many were men, women, young, old? Ask, "Do real scientists all look like this? Who do we know who is a scientist?" Keep it light and curious.

**8 to 12: "Story swap."** Ask the AI for a short story about "a child who is good at [SUBJECT]" several times. Notice the names, the settings, who the friends are. Then ask for the same story with the hero changed in some way, and talk about which version felt more "normal" to your child and why. The aim is not to find a villain. It is to notice that defaults exist.

**13 to 17: "Whose story?"** Ask the AI to explain a historical event, such as a war, an invention or a migration. Then ask: "Now explain the same event from the point of view of [a different group of people who were there]." Compare. What was left out of the first version? Why might that be? Teenagers are often very good at this and enjoy arguing about it.

## How to talk about it without lecturing

Children switch off at a lecture about fairness. They switch on when they find something themselves. So ask questions and let them spot the pattern. If they do not see one, that is fine; you can say what you noticed and ask if they agree.

Avoid two traps. One is saying "the AI is racist" or "sexist" as a flat verdict, which ends thinking. The other is saying "it's just a computer, it doesn't matter", which misses the point that patterns shape what children think is normal. The balanced message: **AI reflects the material it learned from, and part of being a smart user is noticing what it leaves out.**

This also connects to Module 3. When your child's In-Story lessons feature characters who look and live like them, they learn that stories can include everyone. Asking an AI to broaden its defaults is a small version of the same idea.

## Try it now

Run the activity that fits your child's age, using the practice pad. Here is a starting prompt for the 8 to 12 "Story swap". Change the parts in brackets.

\`\`\`try
Write a 100-word story about a child who is brilliant at [SUBJECT, e.g. building robots]. Then write the same story again two more times, each time letting yourself choose different details for the child and their family. After the three stories, list the names, settings and details you chose each time, so we can compare them.
\`\`\`

Read the three stories with your child and ask: "What did the AI choose by default? Who might be missing?" You are done when your child has named at least one pattern or missing voice they noticed, in their own words.`,
        microCheck: [
          {
            question: "Why can an AI tool repeat stereotypes even when nobody programmed it to?",
            options: [
              "It learns patterns from human-made text and images, unfairness included",
              "Its makers add stereotypes on purpose to make answers seem more natural",
              "It copies the opinions of whoever used the tool just before your child",
              "It only repeats stereotypes when a user asks it to be rude or unkind",
            ],
            correctIndex: 0,
            explanation:
              "AI tools learn from vast amounts of human-made material, which contains unfair patterns. Nobody needs to add bias on purpose for the tool to pick it up.",
          },
          {
            question: "An AI draws every \"pilot\" as a man. Your 7-year-old notices. What is the best response?",
            options: [
              "Tell them the AI is sexist and should not be used again",
              "Say it is only a computer, so the picture does not matter",
              "Ask who they know who flies planes and whether they all look alike",
              "Tell them the AI is right because most pilots are probably men",
            ],
            correctIndex: 2,
            explanation:
              "A curious question lets your child think it through. A flat verdict ends the thinking, and dismissing it misses that defaults shape what children see as normal.",
          },
          {
            question: "Your 14-year-old asks AI to explain a historical event. Which follow-up best teaches \"whose voice is missing\"?",
            options: [
              "Ask the AI to make the explanation shorter and simpler",
              "Ask it to retell the event from another group's point of view",
              "Ask it to add more dates and names to make it more accurate",
              "Ask it to confirm that its first explanation was fully complete",
            ],
            correctIndex: 1,
            explanation:
              "Retelling from another perspective shows what the first version left out. Shortening, adding dates or asking for confirmation keeps the same single viewpoint.",
          },
          {
            question: "What is the main reason the lesson prefers questions over lectures when discussing bias?",
            options: [
              "Children notice and remember patterns they discover themselves",
              "Lectures about fairness are not allowed in most primary schools",
              "Questions are quicker, so the activity takes less family time",
              "Children cannot understand bias until they are teenagers",
            ],
            correctIndex: 0,
            explanation:
              "Finding a pattern yourself makes it stick. Children tune out lectures, but they engage when they spot something and are asked what they think.",
          },
        ],
      },
      {
        title: "Honesty and school: using AI without cheating",
        objective: "Find your child's school AI policy and agree a family approach to disclosure and showing their thinking.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## The rules differ, so start with the school

Schools are still working out their approach to AI, and policies vary widely. Some ban AI for homework. Some allow it for certain tasks. Some teach with it in class. Rules can also differ between subjects, teachers and pieces of work, and exam boards usually have their own strict rules for coursework and assessments.

So the first honest step is simple: **find out what your child's school actually says.** Look on the school website, ask the class teacher, or ask your child to check with each teacher when work is set. Module 6 covers the questions to ask in more detail.

Do not rely on what other parents say, or on what a different school does. What counts as fine in one classroom can be treated as cheating in another.

## A simple three-way sort

Once you know the rules, help your child sort AI use into three groups:

- **Allowed**: things the school says are fine, such as asking AI to explain a topic, quiz them before a test or suggest what to revise.
- **Allowed if you say so**: things that are fine only if disclosed, such as using AI to check spelling or suggest a better structure.
- **Not allowed**: things that break the rules, such as handing in AI-written work as their own, or using AI in a test or a piece of assessed coursework where it is banned.

When a task is not covered, the rule of thumb is: **if you would feel uncomfortable telling your teacher how you did it, ask first.**

## Show your thinking

The best protection against both cheating and false accusations is the same thing: evidence of your child's own thinking. Encourage habits like:

- Keeping **rough notes, plans and early drafts**, not just the final version.
- Saving the **AI conversation** when AI was used, so they can show what they asked and what they did with the answer.
- Being able to **explain the work out loud**: why they chose that argument, what a word means, how they got the answer.

The last one is the real test. If your child cannot explain their own homework, the learning did not happen, whatever the rules say. This is the heart of Module 2: AI as a learning partner that keeps the work theirs.

## A disclosure note

When AI is used and the school allows it with disclosure, a short, plain note at the end of the work is enough. For example:

\`\`\`
AI use: I used [TOOL] to [explain photosynthesis to me before I started / check my spelling / suggest a clearer order for my paragraphs]. The ideas, words and final choices are my own.
\`\`\`

Check with the teacher whether they want a particular format.

## If your child is accused of using AI

Some schools use AI-detection tools. These tools can be wrong, and they are known to flag human-written work at times. If your child is accused, stay calm, ask what the concern is based on, and let your child show their notes, drafts and saved chats, and explain the work. Most teachers want to be fair; evidence of thinking makes that easy for them. If your child did break the rules, treat it as a learning moment about honesty rather than only a punishment.

## Try it now

Use the practice pad to see what honest help looks like for a real piece of homework. Change the parts in brackets.

\`\`\`try
I am [AGE] years old. My homework is: [DESCRIBE THE TASK]. My school's rule on AI for this task is: [PASTE OR DESCRIBE THE RULE, or "I am not sure"]. Help me in a way that follows that rule and keeps the work mine. Do not write any part of the answer for me. Ask me questions to help me plan, and at the end suggest a one-sentence disclosure note I could add if the rule allows AI with disclosure. If I am not sure of the rule, tell me what to ask my teacher.
\`\`\`

You are done when you have found your child's school AI policy (or written down the question to ask), and your child has sorted three of their own AI uses into allowed, allowed if disclosed, and not allowed.`,
        microCheck: [
          {
            question: "Another parent says AI is fine for all homework because their child's school allows it. What should you do?",
            options: [
              "Follow their advice, since schools usually share the same rules",
              "Check your own child's school policy and each teacher's rules",
              "Assume AI is banned everywhere until the government says otherwise",
              "Let your child decide, since they know their teachers best",
            ],
            correctIndex: 1,
            explanation:
              "Policies vary between schools, subjects and tasks. Only your child's own school and teachers can tell you what is allowed for their work.",
          },
          {
            question: "Your child is unsure whether using AI to reorganise their essay paragraphs is allowed. What is the best rule of thumb?",
            options: [
              "If it only changes the order, it is always acceptable to do",
              "If you would feel uneasy telling the teacher, ask them first",
              "If the teacher did not mention AI, any use of it is fine",
              "If a friend did the same last term, it must be allowed now",
            ],
            correctIndex: 1,
            explanation:
              "When a task is not covered, discomfort about telling the teacher is a useful signal to ask. Silence from the teacher or a friend's experience is not permission.",
          },
          {
            question: "Which habit best protects your child from both cheating and false accusations?",
            options: [
              "Handing in work early so the teacher has less time to check it",
              "Keeping notes, drafts and saved AI chats that show their thinking",
              "Running their work through an AI detector before handing it in",
              "Only using AI tools that the school has not heard of yet",
            ],
            correctIndex: 1,
            explanation:
              "Evidence of thinking shows the work is theirs and makes a false accusation easy to resolve. Detectors can be wrong, and hiding tool use is itself dishonest.",
          },
          {
            question: "Your 12-year-old's essay is flagged by an AI-detection tool, but you watched them write it. What should you do?",
            options: [
              "Accept the result, since detection tools are rarely mistaken",
              "Calmly ask what the concern is and share drafts and notes",
              "Tell your child to rewrite it in a different style next time",
              "Complain that the school should never check work for AI use",
            ],
            correctIndex: 1,
            explanation:
              "Detection tools can flag human writing. Calmly sharing drafts, notes and letting your child explain the work gives the teacher the evidence to be fair.",
          },
          {
            question: "Your child cannot explain a paragraph in their own homework. What does this most likely show?",
            options: [
              "The paragraph is too advanced and should be marked higher",
              "The learning has not happened yet, whatever tool was used",
              "They are nervous, which is normal and not worth discussing",
              "The school policy on AI must be too strict for this subject",
            ],
            correctIndex: 1,
            explanation:
              "Being able to explain the work is the real test of learning. If they cannot, the thinking was done by someone or something else, and that is worth a calm conversation.",
          },
        ],
      },
      {
        title: "Creating, not just consuming: making things with AI together",
        objective: "Plan and start a creative project with your child where they make the key decisions and AI acts as a helper.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Two ways to use the same tool

Much of what children do with screens is consuming: watching, scrolling, reading what others made. AI can easily become one more thing to consume, where a child types a request and passively receives a finished story, picture or answer.

The same tools can also make children **creators**. A child who designs a character, writes the plot, directs an AI to draw a scene, tests a small game and fixes what does not work is building imagination, planning, persistence and taste. They are also learning how AI works from the inside, which makes them more critical users.

The difference is not the tool. It is **who makes the decisions.**

## The golden rule: your child is the director

In a good creative project, your child decides what the project is, what it should feel like, and when it is good enough. AI is the assistant who helps with the parts they cannot do yet. A few ways to keep it that way:

- **Ideas first, AI second.** Your child sketches, talks or writes their idea before touching AI.
- **Ask for options, not answers.** "Give me three ideas for how the dragon could escape" keeps your child choosing.
- **Edit what comes back.** Nothing goes into the project unchanged. Your child cuts, rewrites, redraws or rejects.
- **Keep a project journal.** A notebook or document with what they tried, what worked and what they changed. It shows their thinking and makes a lovely record.

## Project ideas by age

**Under 8, together with you:**
- **A bedtime story book.** Your child invents the hero and the problem; you use AI to help write it in simple sentences; your child draws the pictures. This is a natural next step from the In-Story approach in Module 3, but now your child is the author.
- **Question of the week.** Pick one big question ("Why is the sky blue?") and use AI together to find a simple explanation, then check it in a book.

**8 to 12, with you nearby:**
- **A comic or picture book.** Your child writes the script; an AI image tool helps create backgrounds; they add speech bubbles themselves.
- **A simple game.** Using a child-friendly block-coding platform, they build a small game and ask AI for help when they are stuck, explaining the fix back to you afterwards.
- **A family quiz night.** They research topics, write the questions and use AI only to check the answers.

**13 to 17, more independent:**
- **A small website or app** for a hobby or club, with AI as a coding helper. They should be able to explain every line they keep.
- **A short film or podcast**, with AI helping to plan scenes or research, while they write, record and edit.
- **A problem-solving project**: something they care about in their school or community, researched with AI and checked against real sources.

## Credit and honesty in creative work

Teach children to be open about what AI made. A simple credit line such as "Illustrations created with an AI image tool from my descriptions" is honest and builds good habits. If the project is going to be shared publicly or entered into a competition, check the rules; some do not allow AI-generated work. And never use real people's faces or voices without permission, as Module 4 covered.

## Try it now

Plan a weekend project together using the practice pad. Change the parts in brackets.

\`\`\`try
My child is [AGE] and loves [INTERESTS]. Suggest 3 creative projects we could start this weekend using AI as a helper, where my child makes the main decisions. For each one, give: what my child does, what the AI helps with, what I do, roughly how long it takes, and one question my child should ask themselves to decide if it is finished. Keep AI in a supporting role and suggest free or low-cost tools in general terms.
\`\`\`

Choose one project with your child. You are done when your child has written or drawn their own idea first, and you have completed one small first step together, such as the main character or the first level.`,
        microCheck: [
          {
            question: "Your 10-year-old asks AI for a complete comic and prints it. What change would turn this into real creating?",
            options: [
              "Choosing a more powerful AI tool that draws even better comics",
              "Having your child write the story and direct the AI for scenes",
              "Printing the comic in colour so it looks more like a real book",
              "Asking the AI to add your child's name as author on the cover",
            ],
            correctIndex: 1,
            explanation:
              "Creating means your child makes the key decisions. A better tool or nicer printing still leaves them as a consumer, and adding their name does not make the work theirs.",
          },
          {
            question: "Which request keeps your child in charge of a creative project?",
            options: [
              "Write the ending of my story so that it sounds really good",
              "Give me three possible endings, and I will pick and edit one",
              "Rewrite my whole story so it is ready to send to a competition",
              "Make my story longer and more exciting by adding extra scenes",
            ],
            correctIndex: 1,
            explanation:
              "Asking for options keeps the choice with the child, and they still edit what they pick. The other requests hand the decisions to the AI.",
          },
          {
            question: "Your teenager used AI to help write code for a club website. What is the best sign that they learnt from it?",
            options: [
              "The website looks professional and has plenty of features",
              "They can explain what each part of the code they kept does",
              "They finished the site much faster than they expected to",
              "The AI tool said the code was correct and well written",
            ],
            correctIndex: 1,
            explanation:
              "Being able to explain the code shows understanding. A polished site, speed or the AI's own approval says nothing about what your teenager actually learnt.",
          },
          {
            question: "Your child wants to enter an AI-illustrated story into a local writing competition. What should you check?",
            options: [
              "Whether the competition's rules allow AI-generated images",
              "Whether the judges will be able to tell the images are AI",
              "Whether other entrants are likely to use AI tools as well",
              "Whether the AI tool is well known enough to be impressive",
            ],
            correctIndex: 0,
            explanation:
              "Some competitions do not allow AI-generated work, and honesty means checking and crediting. Whether judges could tell is not the question to ask.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Your 11-year-old's AI-written project says a famous scientist made a discovery in the wrong century. What habit would have caught this?",
        options: [
          "Asking the same AI tool to double-check its own answer again",
          "Checking key facts in a second trusted source, like a book",
          "Using a newer AI tool, since newer tools do not make mistakes",
          "Reading the answer twice to see whether it sounds convincing",
        ],
        correctIndex: 1,
        explanation:
          "An independent source catches errors the AI repeats confidently. Asking the same tool, trusting newer tools or judging by how convincing it sounds does not.",
      },
      {
        question: "Your 6-year-old hears a smart speaker say something you know is wrong. What is the most useful thing to do?",
        options: [
          "Say nothing, so your child keeps trusting technology at home",
          "Say \"How do we know?\" and check it together in a book",
          "Switch the smart speaker off so it cannot confuse them again",
          "Explain in detail how language models predict the next word",
        ],
        correctIndex: 1,
        explanation:
          "Checking out loud models the habit at the right level for a young child. Silence teaches blind trust, and a technical lecture will not land at six.",
      },
      {
        question: "An AI story tool always makes the \"clever friend\" a boy and the \"kind friend\" a girl. How should you use this with your 9-year-old?",
        options: [
          "Ask them what they notice and who might be missing from the stories",
          "Stop using the tool, because any bias means it is unsafe to use",
          "Ignore it, since stories are only make-believe and do not matter",
          "Tell them boys and girls really are different in these ways",
        ],
        correctIndex: 0,
        explanation:
          "Asking lets your child spot the pattern for themselves, which builds a lasting skill. Dropping the tool or ignoring the pattern teaches nothing about bias.",
      },
      {
        question: "Your teenager asks why an AI tool might have bias if nobody meant to add it. Which explanation is accurate?",
        options: [
          "It learns from human-made material, which contains unfair patterns",
          "It is secretly told what to think by the government of each country",
          "It picks up bias from the other users who are online at that time",
          "It only has bias when its safety filters have been switched off",
        ],
        correctIndex: 0,
        explanation:
          "Bias comes largely from the material AI tools learn from. The other explanations are myths that do not describe how these tools work.",
      },
      {
        question: "Your child's school says AI may be used for revision but not for writing assessed coursework. Which use breaks the rule?",
        options: [
          "Asking AI to quiz them on key terms the night before a test",
          "Pasting an AI-written paragraph into their coursework essay",
          "Asking AI to explain a topic they did not follow in the lesson",
          "Using AI to make flashcards from their own class notes",
        ],
        correctIndex: 1,
        explanation:
          "The rule allows AI for revision but not for writing assessed work. Pasting AI-written text into coursework is exactly what it forbids.",
      },
      {
        question: "Your 13-year-old used AI to check spelling on homework where the teacher allows AI with disclosure. What should they do?",
        options: [
          "Nothing, because spelling help is too small to be worth mentioning",
          "Add a short note saying which tool was used and what it did",
          "Remove all the corrections so the work is entirely their own",
          "Ask a friend to check whether the teacher would ever notice",
        ],
        correctIndex: 1,
        explanation:
          "Where the rule is \"allowed with disclosure\", a short, plain note meets it. Hiding small uses or removing corrections misses the point of honest disclosure.",
      },
      {
        question: "A teacher says your child's essay was flagged by an AI detector. Your child wrote it themselves. What gives the strongest support?",
        options: [
          "Their notes, drafts and being able to explain the work aloud",
          "A second AI detector that gives a different, lower score",
          "A letter from you saying your child would never cheat",
          "A request that the school stop using detectors altogether",
        ],
        correctIndex: 0,
        explanation:
          "Evidence of the thinking behind the work is the clearest proof. Detector scores disagree and can be wrong, and a parent's assurance is not evidence.",
      },
      {
        question: "Your child wants AI to make a whole birthday card for Grandma. How could you turn it into a creative project?",
        options: [
          "Let them pick the best card from ten designs the AI produces",
          "Have them plan the words and picture, using AI for one part",
          "Print the AI card on better paper so it looks more personal",
          "Ask the AI to write the card as if your child had written it",
        ],
        correctIndex: 1,
        explanation:
          "When your child plans the card and uses AI for just one part, they stay the creator. Choosing from finished designs or disguising AI work leaves the decisions with the tool.",
      },
      {
        question: "Your 15-year-old asks AI whether a supplement they saw online is safe. The answer sounds reassuring. What should they do?",
        options: [
          "Trust it, since AI answers about health are usually well checked",
          "Check with a pharmacist, doctor or official health information",
          "Ask two other chatbots and go with the answer they agree on",
          "Search social media for other teenagers who have tried it",
        ],
        correctIndex: 1,
        explanation:
          "The higher the stakes, the more reliable the check needs to be. Health questions need a qualified or official source, not more chatbots or social posts.",
      },
      {
        question: "Which approach to a family AI art project best builds your child's skills?",
        options: [
          "The AI makes several pictures and your child picks a favourite",
          "Your child sketches, directs the AI and then edits the result",
          "You write the prompts so the AI produces the best possible art",
          "Your child copies the style of an AI picture they found online",
        ],
        correctIndex: 1,
        explanation:
          "Sketching, directing and editing keep your child making the decisions. Picking from AI output or copying it leaves them as a consumer.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 6
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Your Family AI Plan",
    summary:
      "Bring the course together into a plan that fits your family: what suits each age, a family AI agreement written together, a working partnership with school, and a calm monthly routine for keeping up.",
    lessons: [
      {
        title: "An age-by-age guide",
        objective: "Decide what AI use and how much supervision fits each of your children, based on their age and maturity.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Age is a guide, not a rule

Children develop at different speeds. A thoughtful 11-year-old may handle more than an impulsive 14-year-old. So use the bands below as a starting point, then adjust for your child's maturity, their needs and what you have seen of how they handle independence.

One fixed point does not move: **the tool's own age limit.** Many general AI chatbots set a minimum age in their terms and some require parental consent for under-18s. Check the current terms of each tool, because they vary and change. Where a child is under the limit, look for tools designed for their age, or use AI together on your account with you in charge.

## Under 8: together, always

At this age AI should be a **shared activity**, like reading a book together. Your child does not use AI tools on their own.

**Good uses:**
- Making up stories together, where your child chooses the characters and what happens next.
- Personalised learning stories in the In-Story style from Module 3, with you reading alongside.
- Answering "why" questions together, then checking in a book.

**Supervision:** You hold the device and type. Voice assistants in shared rooms only.

**Key lessons to start:** "The computer can be wrong." "We don't tell it our name or where we live." "If something is strange or scary, we tell a grown-up."

## 8 to 12: supervised independence

Children now start using AI for school and hobbies, with you nearby and clear limits.

**Good uses:**
- AI as a tutor that asks questions rather than giving answers (Module 2).
- Checking understanding before a test: "Quiz me on my times tables."
- Creative projects where the child directs and AI helps (Module 5).
- Child-friendly learning platforms designed for this age.

**Supervision:** Use in shared spaces, not bedrooms. Tools and accounts that you set up and know about. Regular, relaxed chats about what they are using it for.

**Key lessons to build:** the never-share list, "How do you know?", the family safe word, telling you if anything feels wrong, and not handing in AI work as their own.

## 13 to 17: growing trust

Teenagers will use AI with more freedom, including on their own devices and at friends' houses. Your role shifts from supervisor to **coach**.

**Good uses:**
- AI for research, revision, feedback on drafts and coding, within school rules.
- Planning, organising and learning new skills for hobbies or future careers.
- Bigger creative and problem-solving projects.

**Supervision:** Fewer controls, more conversation. Teen accounts or family settings where the tool offers them. Agreed rules on night-time use and phones in bedrooms. Plan with them when controls will loosen further.

**Key lessons to deepen:** checking high-stakes answers, honesty and disclosure at school, deepfakes and sextortion awareness, AI companions and emotional reliance, and thinking about their own digital footprint.

## Siblings of different ages

Families with children in several bands often find it easiest to set rules by **child**, not household: "the tablet rules" for the 7-year-old and "the phone rules" for the 14-year-old. Explain the difference to the younger one as something they will grow into, not a punishment. Older siblings can also be great role models for checking and honesty, if you ask them to be.

## Try it now

Use the practice pad to draft a starting plan for each child. Change the parts in brackets.

\`\`\`try
I have [NUMBER] children aged [AGES]. Their main interests are [INTERESTS] and they currently use [DEVICES AND AI TOOLS, or "no AI tools yet"]. For each child, suggest: two good ways to use AI for learning at their age, how much supervision is sensible, two safety lessons to focus on, and one sign that they are ready for more independence. Remind me to check each tool's current age limit and settings.
\`\`\`

You are done when you have written down, for each child, one AI use you will encourage, the level of supervision you will use, and one safety lesson you will focus on this month.`,
        microCheck: [
          {
            question: "Your 6-year-old wants to use a chatbot on their own to make up stories. What fits the age guide?",
            options: [
              "Allow it, since story writing is a low-risk and creative use",
              "Make it a shared activity where you hold the device and type",
              "Allow it only on a tablet with the volume turned right down",
              "Wait until they are 13 before doing anything with AI at all",
            ],
            correctIndex: 1,
            explanation:
              "Under 8, AI works best as a shared activity with you in charge. There is no need to avoid it completely; the value comes from doing it together.",
          },
          {
            question: "Where should a 10-year-old usually use AI tools, according to the guide?",
            options: [
              "In their bedroom, so they can concentrate on homework quietly",
              "In a shared space, using tools and accounts you know about",
              "Anywhere they like, as long as filters are switched on first",
              "Only at school, since home use is not suitable before 13",
            ],
            correctIndex: 1,
            explanation:
              "Shared spaces and known accounts keep AI use visible while children learn. Filters alone miss things, and a total home ban loses useful learning.",
          },
          {
            question: "How does the parent's role change for teenagers aged 13 to 17?",
            options: [
              "From supervisor to coach, with fewer controls and more talk",
              "From coach to supervisor, with stricter checks on every chat",
              "It ends, because teenagers can manage AI on their own now",
              "It moves to the school, which takes over responsibility",
            ],
            correctIndex: 0,
            explanation:
              "Teenagers need growing independence with guidance. Parents shift to coaching, keeping the conversation going rather than tightening control or stepping away.",
          },
          {
            question: "You have children aged 7 and 14. What does the lesson suggest for household rules?",
            options: [
              "One set of rules for everyone, based on the older child's age",
              "One set of rules for everyone, based on the younger child's age",
              "Rules set by child, with the difference explained as growing up",
              "No rules at all, and let the children agree things between them",
            ],
            correctIndex: 2,
            explanation:
              "Different ages need different rules. Explaining the younger child's rules as something they will grow into makes the difference feel fair rather than punishing.",
          },
        ],
      },
      {
        title: "Writing a family AI agreement together",
        objective: "Draft a short family AI agreement with your children that covers tools, privacy, honesty, safety and a review date.",
        durationMinutes: 22,
        contentType: "article",
        bodyMd: `## Why write it down, and why together

You have covered a lot in this course: privacy, safe words, companions, checking, honesty at school, creating. A family AI agreement pulls it into one page that everyone can see.

Writing it **together** matters more than the wording. Children follow rules they helped make far more readily than rules handed to them. The conversation itself teaches: when your 12-year-old argues about bedtime phone use, they are thinking about why the rule exists. And an agreement is two-way. Parents make promises too.

Keep it short. One page, plain language, positive where possible ("We check facts in a second source") rather than a long list of bans.

## What to include

A good family AI agreement usually covers seven areas:

1. **Which tools we use**, and who sets up new ones. For example: "We ask before installing a new AI app, so we can check its age limit together."
2. **Where and when**: shared spaces for younger children, no AI chat after a set time, devices out of bedrooms at night.
3. **What we never share**: your never-share list from Module 4.
4. **Checking**: "If it matters, we check it somewhere else."
5. **School honesty**: "We follow each teacher's rules, say when we used AI, and keep our drafts."
6. **Safety and telling**: the safe word rule, and "if anything online makes us uncomfortable, scared or pressured, we tell a parent, and we will not be in trouble for telling."
7. **Parents' promises**: for example, "We will listen before we react," "We will tell you what settings we use and why," and "We will not share photos of you online without asking."

Add a **review date**. Agreements go stale as children grow and tools change. Every three to six months is sensible, and Lesson 4 gives you a monthly check-in that makes the review easy.

## How to run the conversation

- **Pick a calm moment**, not straight after an argument about screens.
- **Start with what is going well**: "You've been using AI really well for your science revision."
- **Ask before you tell**: "What rules do you think make sense?" Children often suggest stricter rules than you would.
- **Explain your reasons** for anything you insist on. "Because I said so" does not survive the first sleepover.
- **Write it in your family's words**, not a template's.
- **Everyone signs it**, parents included, and it goes somewhere visible.

Different ages can have different sections. A 7-year-old's version might be three pictures and three sentences; a 15-year-old's can be more detailed and more about trust.

## Using AI to draft it

AI can help you turn your family's scribbled rules into a tidy, friendly agreement. The rules must come from your family, though. If you ask AI to invent the rules, you get a generic document nobody feels ownership of.

## Try it now

First, sit down together and jot rough notes for each of the seven areas in your own words. Then paste them into the practice pad using the prompt below, changing the parts in brackets.

\`\`\`try
Help us turn our family's own rules into a one-page Family AI Agreement. Our children are aged [AGES]. Here are our rules in our own words:

Tools we use: [YOUR NOTES]
Where and when: [YOUR NOTES]
What we never share: [YOUR NOTES]
Checking: [YOUR NOTES]
School honesty: [YOUR NOTES]
Safety and telling: [YOUR NOTES]
Parents' promises: [YOUR NOTES]
Review date: [DATE]

Keep our meaning and do not add new rules. Use warm, positive, simple language a [YOUNGEST AGE]-year-old can follow. Use "we" throughout. Add a line for everyone to sign. Then list any area where our notes are unclear, as questions for us to discuss.
\`\`\`

Read the draft together and edit anything that does not sound like your family. You are done when every family member has agreed and signed the agreement, and it is somewhere everyone can see it.`,
        microCheck: [
          {
            question: "Why does the lesson stress writing the family AI agreement together with your children?",
            options: [
              "Children follow rules they helped make more readily",
              "Agreements are only legally valid if children sign them",
              "Children know more about AI tools than their parents do",
              "It saves time, because children write the whole thing",
            ],
            correctIndex: 0,
            explanation:
              "Ownership makes rules stick, and the discussion itself teaches the reasons behind them. It is not a legal requirement, and parents still guide the content.",
          },
          {
            question: "You ask an AI tool to write your family's AI rules from scratch. What is the main problem?",
            options: [
              "AI tools are not able to write documents for families",
              "The rules will be generic and nobody will feel they own them",
              "The rules will be too short to cover every possible risk",
              "The agreement will be too strict for children to follow",
            ],
            correctIndex: 1,
            explanation:
              "AI is useful for tidying your family's own rules, but invented rules lack the ownership and discussion that make an agreement work.",
          },
          {
            question: "Which item best belongs in the \"parents' promises\" section of an agreement?",
            options: [
              "We will check every chat you have with an AI tool each day",
              "We will listen before we react if you tell us about a problem",
              "We will allow any AI app once you have had it for one month",
              "We will decide all the rules and explain them only if asked",
            ],
            correctIndex: 1,
            explanation:
              "Promising to listen first makes it safe for children to come to you. Checking every chat or deciding everything alone undermines the trust the agreement relies on.",
          },
          {
            question: "Why should a family AI agreement include a review date?",
            options: [
              "Because children grow and AI tools change over time",
              "Because agreements must be renewed each year by law",
              "Because children will forget the rules within a week",
              "Because a review date lets parents drop rules they dislike",
            ],
            correctIndex: 0,
            explanation:
              "What suits a 10-year-old will not suit them at 12, and tools and features change. A review date keeps the agreement relevant and shows it can grow with them.",
          },
          {
            question: "Your 12-year-old suggests a rule that is stricter than you planned. What is the best response?",
            options: [
              "Overrule it, since parents should always set the limits",
              "Take it seriously and talk through whether it would work",
              "Accept it without discussion to avoid any disagreement",
              "Laugh it off, since children do not usually mean such rules",
            ],
            correctIndex: 1,
            explanation:
              "Taking your child's ideas seriously shows the agreement is genuinely shared. Talking it through helps you both decide whether it is workable.",
          },
        ],
      },
      {
        title: "Working with teachers and school",
        objective: "Ask your child's school the right questions about AI and build a helpful, two-way partnership with their teachers.",
        durationMinutes: 18,
        contentType: "article",
        bodyMd: `## Why school and home need to line up

Your child moves between two worlds: home and school. If the AI rules in each are different and nobody talks about it, your child is left guessing, and guessing is where honest mistakes and real cheating both happen.

Schools are also still learning. Many teachers are working out how AI fits their subject at the same time as your child is. A friendly, curious parent is often very welcome. A worried or angry one tends to get a defensive answer.

So approach it as a partnership: you know your child, they know the curriculum and the classroom, and you both want the same thing.

## Questions to ask

You do not need to ask all of these at once. Pick the ones that matter most for your child's age and stage.

**About the rules:**
- Does the school have a written policy on AI use? Where can I read it?
- Does it differ by subject, year group or type of work?
- How do you want students to show or disclose AI use?
- What happens if a student is unsure whether something is allowed?

**About learning:**
- Are AI tools used in class? Which ones, and for what?
- How are students taught to check AI answers and think critically about them?
- How can we support the same approach at home?

**About safety and data:**
- If students use AI tools with school accounts, what information about them is shared with the tool?
- How does the school handle AI-generated images or bullying among pupils?

**About assessment:**
- How do you tell whether work reflects a student's own understanding?
- Does the school use AI-detection tools, and how are results checked before any action?

## How to ask

- **Use the normal routes**: a parents' evening, an email to the class teacher or form tutor, or a question at a parent forum.
- **Start positively**: "We are trying to help our son use AI well at home and want to match what you are doing."
- **Keep it short.** Two or three questions in an email is better than ten.
- **Share, do not just ask.** If something works at home, such as a tutor-style prompt or your family agreement, offer it. Teachers often appreciate practical ideas from families.

## Sharing what works

Parents can contribute more than they think. You might offer to share your family AI agreement as an example, suggest a parent session on AI safety, or simply tell a teacher that the "show your thinking" habit is working well at home. Small, positive contributions build trust, which matters if a harder conversation comes up later.

And if something goes wrong, such as an accusation of AI misuse or an incident involving fake images, that established relationship makes it far easier to resolve calmly.

## Try it now

Draft a friendly first email to your child's teacher using the practice pad. Change the parts in brackets.

\`\`\`try
Help me write a short, friendly email (under 150 words) to my child's [TEACHER'S ROLE, e.g. class teacher or form tutor]. My child is in [YEAR OR GRADE]. I want to ask [2 OR 3 QUESTIONS FROM THE LESSON] about how AI is used and what the rules are, and mention that at home we [ONE THING THAT IS WORKING]. The tone should be positive and supportive, not worried or critical. Do not include my child's full name; I will add it.
\`\`\`

You are done when you have edited the email into your own words and sent it, or noted your questions ready for the next parents' evening.`,
        microCheck: [
          {
            question: "You are worried your child's school has no clear AI policy. Which opening to the teacher is most likely to help?",
            options: [
              "I am shocked the school has not sorted out its AI rules yet",
              "We want to support AI use at home in the same way you do",
              "Other schools have much clearer rules than yours on this",
              "I need a full written policy from you by the end of the week",
            ],
            correctIndex: 1,
            explanation:
              "A positive, partnership opening invites a helpful reply. Criticism or demands tend to make teachers defensive, even when the concern is fair.",
          },
          {
            question: "Which question to the school best helps you protect your child's privacy?",
            options: [
              "Which AI tool is the most popular among students this year?",
              "What student data is shared with the AI tools used at school?",
              "How many teachers at the school are using AI to plan lessons?",
              "Will the school be buying new laptops for the students soon?",
            ],
            correctIndex: 1,
            explanation:
              "Knowing what student data goes to AI tools used through school accounts is directly about privacy. The others may be interesting but do not address it.",
          },
          {
            question: "Why does the lesson suggest sharing what works at home, not just asking questions?",
            options: [
              "Schools must adopt any approach that parents recommend to them",
              "It builds trust that helps if a harder conversation comes later",
              "It shows the teacher that your family knows more about AI",
              "It means you will not need to follow the school's own rules",
            ],
            correctIndex: 1,
            explanation:
              "Positive contributions build a relationship. That trust makes any later difficulty, such as an accusation or incident, easier to resolve calmly.",
          },
          {
            question: "How many questions should you usually put in a first email to a teacher about AI?",
            options: [
              "Two or three focused questions that matter most to you",
              "Every question from the lesson so nothing is left out",
              "None, because teachers prefer that parents do not ask",
              "One, and only if your child has already been in trouble",
            ],
            correctIndex: 0,
            explanation:
              "A short, focused email is easier for a busy teacher to answer well. You can ask more at a parents' evening or later as the relationship develops.",
          },
        ],
      },
      {
        title: "Keeping up without panic: a monthly check-in",
        objective: "Set up a 20-minute monthly family check-in on AI and balance AI use with screen-free time.",
        durationMinutes: 20,
        contentType: "article",
        bodyMd: `## You do not need to keep up with everything

AI tools change fast. New apps appear, features are added, and headlines swing between wonder and alarm. It is easy to feel that you are always behind, and that feeling can push parents towards either panic or giving up.

You do not need to know every tool. You need to know **your child**: what they use, how they use it, and whether anything is worrying them. That comes from a regular, calm conversation, not from reading every news story.

A good principle: **one routine beats a hundred worries.** A short monthly check-in means small issues come up while they are still small.

## The 20-minute monthly check-in

Put it in the calendar, same time each month. Keep it relaxed: over a snack, on a walk, in the car. Four parts of about five minutes each:

**1. What is new? (5 minutes)**
- "Have you started using any new apps or AI tools?"
- "Has anything changed in the ones you already use?"
- Parents share too: "I tried a new feature this month..."

**2. Show me something good (5 minutes)**
- Your child shows you something they made, learnt or enjoyed with AI.
- Be genuinely interested. This part is why children look forward to the check-in rather than dreading it.

**3. Anything odd or worrying? (5 minutes)**
- "Has anything online made you uncomfortable, confused or pressured?"
- "Has an AI told you something that turned out to be wrong?"
- "Has anyone asked you for photos, money or secrets?"
- Remind them of the promise: telling you never gets them in trouble.

**4. Adjust (5 minutes)**
- Look at the family AI agreement. Does anything need changing?
- Do any settings need updating, or loosening as trust grows?
- One thing each person will try or change before next month.

Younger children may only manage parts 2 and 3. Teenagers may prefer a shorter, more informal version. Adapt it; the regularity matters more than the format.

## Keeping yourself informed, calmly

Choose **one or two trusted sources** for keeping up: your child's school newsletter, a reputable online safety organisation in your country, or the official help pages of the tools your family uses. Check them once a month, just before your check-in.

When you see an alarming headline, ask the questions you have taught your children: "How do we know? Where else can I check? Does this affect us?" Many headlines describe real risks that you have already planned for in this course.

## Balance with screen-free time

AI is one part of a good childhood, not the centre of it. Children also need sleep, physical play, time outdoors, face-to-face friendships, boredom and hands-on making. A few practical balances:

- **Screen-free zones and times**: meals, the hour before bed, and bedrooms overnight.
- **Offline versions of AI activities**: after an AI story session, act it out or draw it by hand; after an AI quiz, play a board game on the same topic.
- **Model it.** If you are glued to your phone, the rule will not hold. Put your device away during family time too.

The aim is not to minimise AI. It is to make sure AI adds to your child's life and learning rather than crowding out the things only people and the real world can give.

## Try it now

Plan your first check-in using the practice pad. Change the parts in brackets.

\`\`\`try
Create a friendly 20-minute monthly family AI check-in for a family with children aged [AGES]. Use four parts of about 5 minutes: what is new, show me something good, anything odd or worrying, and adjust. For each part, give 3 questions suited to my children's ages, in warm, casual language. Then suggest 3 screen-free activities we could do afterwards linked to [OUR INTERESTS].
\`\`\`

You are done when you have put a repeating 20-minute check-in in the family calendar and chosen one screen-free activity to do straight after the first one.`,
        microCheck: [
          {
            question: "You read an alarming news story about a new AI app. What is the most useful response?",
            options: [
              "Ban every AI app in the house until the story blows over",
              "Check a trusted source and ask whether it affects your family",
              "Ignore it, since news stories about AI are always exaggerated",
              "Forward it to every parent in the class group chat straight away",
            ],
            correctIndex: 1,
            explanation:
              "Applying the same checking questions you teach your children keeps you calm and informed. Blanket bans, ignoring it or spreading it all skip the thinking.",
          },
          {
            question: "Why does the check-in include a \"show me something good\" part?",
            options: [
              "It gives parents a chance to grade their child's AI projects",
              "It makes children look forward to the check-in, not dread it",
              "It proves to the school that the child is using AI properly",
              "It lets parents find out which AI tools are the most popular",
            ],
            correctIndex: 1,
            explanation:
              "If the check-in only covers risks, it feels like an interrogation. Genuine interest in what they made keeps children engaged and open.",
          },
          {
            question: "Your 15-year-old finds the full monthly check-in too formal. What does the lesson suggest?",
            options: [
              "Insist on the full format, since consistency matters most",
              "Stop the check-ins, since teenagers do not need them any more",
              "Keep it regular but make it shorter and more informal for them",
              "Replace the talk with checking their phone history each month",
            ],
            correctIndex: 2,
            explanation:
              "Regularity matters more than format. Adapting to a teenager keeps the conversation going, while dropping it or secretly checking their phone damages trust.",
          },
          {
            question: "Which is the best example of balancing AI use with screen-free time?",
            options: [
              "Allowing extra AI time on weekends to make up for school days",
              "Acting out or drawing an AI story by hand after making it",
              "Using AI only on a large screen so the whole family can see",
              "Letting children use AI at bedtime if they have done homework",
            ],
            correctIndex: 1,
            explanation:
              "Turning an AI activity into an offline one builds creativity, movement and time together. Extra screen time or bedtime use pulls in the opposite direction.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Your 5-year-old asks to use an AI chatbot on your phone while you cook. What fits the age-by-age guide?",
        options: [
          "Hand it over, since the chatbot has built-in filters for children",
          "Suggest doing it together once you can sit down beside them",
          "Hand it over, as long as they only ask questions about animals",
          "Say AI is for adults and must never be used by young children",
        ],
        correctIndex: 1,
        explanation:
          "Under 8, AI is a shared activity with you in charge. Filters and topic limits are not a substitute, and a flat ban misses a good learning opportunity.",
      },
      {
        question: "Your 10-year-old wants to use AI for homework in their bedroom with the door shut. What is the best response?",
        options: [
          "Allow it, since homework is always a safe use of AI tools",
          "Agree on a shared space for AI use and explain why",
          "Allow it, as long as they show you the finished homework",
          "Refuse all AI use until they are old enough for a phone",
        ],
        correctIndex: 1,
        explanation:
          "For 8 to 12, shared spaces keep use visible while habits form. Explaining why helps them accept it, and seeing only the finished work misses how it was done.",
      },
      {
        question: "Your 16-year-old wants fewer parental controls. What approach fits the 13 to 17 guidance?",
        options: [
          "Remove every control at once, since they are nearly adults now",
          "Agree a plan to loosen controls step by step as trust grows",
          "Keep all current controls in place until they turn eighteen",
          "Add more controls, since older teenagers face greater risks",
        ],
        correctIndex: 1,
        explanation:
          "Parents shift to coaching, and controls loosen as judgement and trust grow. An agreed, stepped plan avoids both a sudden drop and a standoff.",
      },
      {
        question: "You are drafting a family AI agreement. Which step matters most for it to work?",
        options: [
          "Using a professional template so the wording sounds official",
          "Writing it with your children, in your family's own words",
          "Making it as detailed as possible so every case is covered",
          "Keeping it private so children cannot argue with the rules",
        ],
        correctIndex: 1,
        explanation:
          "Children keep rules they helped make and understand. Official wording, great length or secrecy all reduce ownership.",
      },
      {
        question: "Which line from a family AI agreement best encourages children to report problems?",
        options: [
          "Anyone who breaks a rule loses their device for a whole week",
          "If something online worries us, we tell and are not in trouble",
          "Parents will check every message on every device each evening",
          "We never use AI tools, so nothing can go wrong in our house",
        ],
        correctIndex: 1,
        explanation:
          "A promise that telling is safe makes children more likely to come to you early. Harsh penalties and total monitoring make hiding problems more likely.",
      },
      {
        question: "You use AI to turn your family's rough rules into a tidy agreement. What should the prompt tell the AI?",
        options: [
          "Add any extra rules an expert would recommend for families",
          "Keep our meaning, add no new rules and list anything unclear",
          "Make the rules stricter so the children take them seriously",
          "Write it in formal legal language so it feels more binding",
        ],
        correctIndex: 1,
        explanation:
          "The rules must come from your family. Telling the AI to keep your meaning and flag unclear points gives a tidy draft without replacing your decisions.",
      },
      {
        question: "Your child's teacher says AI is allowed for some homework but you are unsure which. What is the best next step?",
        options: [
          "Guess based on what your older child's school allowed before",
          "Ask the teacher a short, friendly question about which tasks",
          "Tell your child to use AI for everything until told otherwise",
          "Tell your child to avoid AI entirely to be completely safe",
        ],
        correctIndex: 1,
        explanation:
          "A short, friendly question gets a clear answer and builds the home-school partnership. Guessing or going to either extreme leaves your child unsure.",
      },
      {
        question: "Which question to school is most useful if you are worried about AI-detection tools?",
        options: [
          "Which company makes the detection tool that the school uses?",
          "How are detector results checked before any action is taken?",
          "Can parents buy the same detection tool for use at home?",
          "Why does the school not simply ban every AI tool instead?",
        ],
        correctIndex: 1,
        explanation:
          "Detection tools can be wrong, so what matters is how results are checked before action. The other questions do not protect your child from a false accusation.",
      },
      {
        question: "Your family's monthly check-in keeps turning into a list of warnings. What would improve it?",
        options: [
          "Holding it less often so children do not get tired of it",
          "Adding a \"show me something good\" part your child leads",
          "Making it longer so every possible risk can be covered",
          "Having it only when something has already gone wrong",
        ],
        correctIndex: 1,
        explanation:
          "A positive part led by your child keeps them engaged and open. Fewer, longer or crisis-only check-ins lose the calm routine that catches small issues early.",
      },
      {
        question: "You feel overwhelmed by constant AI news. What does the lesson recommend?",
        options: [
          "Follow every AI news source so you never miss a new risk",
          "Pick one or two trusted sources and check them monthly",
          "Stop following AI news altogether and rely on the school",
          "Ask your children to keep you updated on every new app",
        ],
        correctIndex: 1,
        explanation:
          "One or two trusted sources, checked before your monthly check-in, keep you informed without panic. Following everything or nothing both leave you worse off.",
      },
      {
        question: "Which family habit best balances AI use with screen-free time?",
        options: [
          "Allowing AI at meals if it is being used for learning",
          "Phones and tablets out of bedrooms overnight for everyone",
          "Letting children earn extra AI time by doing chores",
          "Using AI only on weekdays and screens all weekend",
        ],
        correctIndex: 1,
        explanation:
          "Screen-free bedrooms at night protect sleep and apply to parents too, which models the habit. The other options add screen time or tie it to rewards.",
      },
    ],
  },
];
