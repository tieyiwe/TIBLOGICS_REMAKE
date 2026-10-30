import type { SeedLab, SeedModule } from "../../types";

// AI-Empowered Youth: Think, Build, Lead. Explorer lane (ages 10 to 13).
// Season 1, "Understand: How AI really works (in your world)", modules 1 to 3.
//
// Every lesson follows the same rhythm: Learn (a clear idea with an everyday
// example), Play (a Studio tool or a prompt that runs on ARFA's own safe AI),
// Try it now (a small build or task) and a closing Reflect question. Each
// lesson names one thinking tool: first principles, 5 Whys, systems map,
// claim-evidence-reasoning, debugging mindset or "explain it back".
//
// Safety: no outside sign-ups or AI accounts, no personal data, and
// screen-time ideas offered as choices, not lectures.

export const YOUTH_EXPLORER_S1_MODULES: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1: How your feed knows you
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "How your feed knows you",
    summary:
      "Find out how video and social apps choose what you see next: the signals you send, the loop that builds a bubble around you, the design tricks that make it hard to stop, and the moves that put you back in charge.",
    lessons: [
      {
        title: "Your feed is learning from you",
        objective: "Name at least five signals a video app collects from you and explain how they shape what it shows next.",
        durationMinutes: 10,
        contentType: "article",
        isPreview: true,
        bodyMd: `## Learn: every swipe is a message

Open a video app and the first clip is already picked for you. How does the app know you love football skills, or Afrobeats dance challenges, or slime videos? You told it. Not with words, but with what you did.

Every time you use the app, you send it little messages called **signals**. A signal is any clue about what you like. Here are the big ones:

- **Watch time**: did you watch to the end, or swipe away after two seconds?
- **Rewatches**: did you play it again?
- **Likes, comments and shares**: did you tap the heart or send it to a friend?
- **Follows**: did you follow the creator?
- **Skips**: swiping away fast is a signal too. It says "not this".
- **Searches**: what you type in the search box.
- **When and where**: the time of day and the kind of device you use.

The app does not know you as a person. It knows a long list of signals. A computer program called a **recommendation algorithm** (a set of steps for choosing what to show) uses that list to guess which video you are most likely to watch next. Apps do not publish their exact recipe, but signals like these are the main ingredients.

Imagine Amara in Accra. After school she watches three videos of footballers doing step-overs, all the way to the end. She replays one. The next day her feed is full of football skills. Nobody at the app decided that. The algorithm noticed a pattern in her signals and served more of it.

## Play: run your own feed

In the tool below you are the app. Watch how a pretend viewer's signals change what the feed shows next. Try to make the feed show a topic the viewer has never searched for.

\`\`\`studio
feed-simulator:your-feed
\`\`\`

Notice which signals moved the feed most. Was it likes, or simply watching longer?

## Thinking tool: explain it back

A great way to check you really understand something is to **explain it back** in your own words, as if to a younger cousin. If you can explain it simply, you understand it. If you get stuck, that shows you exactly which part to look at again.

Try it with the AI on this page. It runs on ARFA's own safe AI, so you do not need any other account.

\`\`\`try
I am [YOUR AGE] years old. I am going to explain how a video app chooses what to show me. Listen, then tell me one thing I got right and one thing I missed. Do not give me the full answer, give me a hint. Here is my explanation: [WRITE 2 OR 3 SENTENCES IN YOUR OWN WORDS]
\`\`\`

## Try it now

Be a **signal detective** for one day.

1. Next time you use a video or social app, notice five signals you send. Write them down in a notebook (not in the app).
2. For each one, write what you think the app "learned" from it. For example: "I watched a cooking video twice. The app might think I want more cooking."
3. Tomorrow, check: did your feed change the way you predicted?

You are done when you have five signals and one prediction you checked.

**Reflect:** which signal do you think you send without even noticing?`,
        microCheck: [
          {
            question: "Kofi watches a basketball video to the very end, then swipes past a dance video in one second. What has the app most likely learned?",
            options: [
              "He likes basketball more than dance, at least right now",
              "He will never want to see any dance videos ever again",
              "Nothing, because he did not tap like on either video",
              "He wants longer videos, whatever the topic happens to be",
            ],
            correctIndex: 0,
            explanation:
              "Watch time and fast skips are both signals, even without a like. The app guesses he prefers basketball for now, but one skip does not mean he will never see dance again.",
          },
          {
            question: "What is a recommendation algorithm?",
            options: [
              "A person at the app who picks videos for each user",
              "A set of steps that guesses what you will watch next",
              "A list of the most popular videos in your country",
              "A filter that only shows videos from your friends",
            ],
            correctIndex: 1,
            explanation:
              "An algorithm is a set of steps. A recommendation algorithm uses your signals to predict what you are likely to watch. No person picks each video for you, and it is not just a popularity chart.",
          },
          {
            question: "Which of these is NOT a signal the app can use?",
            options: [
              "How long you watch a video before you swipe",
              "Whether you share a clip with a friend or cousin",
              "What you were secretly thinking while watching",
              "What you typed into the app's search box",
            ],
            correctIndex: 2,
            explanation:
              "Apps only see what you do: watching, skipping, sharing, searching. They cannot read your thoughts. That is why a long watch of something you actually disliked can still push more of it into your feed.",
          },
          {
            question: "Zainab wants to check she really understands how feeds work. What does the 'explain it back' tool ask her to do?",
            options: [
              "Copy the lesson out word for word into her notebook",
              "Explain it simply in her own words and spot gaps",
              "Ask an AI to explain it again in a longer way",
              "Watch a video about algorithms all the way through",
            ],
            correctIndex: 1,
            explanation:
              "Explaining something in your own words shows what you truly understand and where you get stuck. Copying or rereading feels like learning but does not test it.",
          },
        ],
      },
      {
        title: "The bubble you did not choose",
        objective: "Draw the feedback loop that builds a filter bubble and explain why it grows stronger over time.",
        durationMinutes: 11,
        contentType: "article",
        bodyMd: `## Learn: the loop that keeps going round

Last lesson you saw that the app shows more of what you watch. Now follow that idea a few steps further.

1. You watch a few gaming videos.
2. The app shows you more gaming videos.
3. Because your feed is mostly gaming now, you watch even more gaming.
4. The app becomes even more sure you only like gaming.
5. Back to step 2.

This is a **feedback loop**: the result of one step feeds back into the start and pushes it further. Because each turn makes the next one stronger, it is called a **reinforcing loop**. Think of a snowball rolling downhill. It picks up snow, gets bigger, picks up even more snow.

After enough turns you end up inside a **filter bubble**: a feed that shows you a narrow slice of the world, filtered to what you already like. You did not choose the bubble. It grew one swipe at a time.

Is a bubble always bad? Not always. If you love chess, a chess bubble can be great. The problem is what you **miss**: other topics you might love, other points of view, and news that matters to your community. And if the bubble is full of one opinion, it can start to feel like everyone thinks that way.

Imagine Diego in Houston. He watched a few videos saying one sports drink makes you faster. Now his feed is full of them. He starts to believe every athlete drinks it. His feed is not the world. It is a mirror of his last few weeks of watching.

## Play: watch a bubble form

In this tool, keep feeding the viewer the same kind of video and watch the variety in their feed shrink. Then see how long it takes to pop the bubble.

\`\`\`studio
feed-simulator:filter-bubble
\`\`\`

## Thinking tool: the systems map

A **systems map** is a simple drawing of the parts of something and the arrows between them. You draw a circle of arrows when something loops back on itself. Systems thinkers ask: "What feeds what?"

For a feed, the parts are: what you watch, what the app learns, what the app shows. Draw an arrow from each one to the next and you get a circle. That circle is the bubble machine.

Want help? Ask the AI on this page:

\`\`\`try
I am learning about feedback loops. Help me draw a simple systems map of how a filter bubble forms on a video app, using words and arrows only (like A -> B -> C -> back to A). Use an example about [A TOPIC YOU LIKE]. Then ask me one question to check I understood.
\`\`\`

## Try it now

Draw your own bubble map on paper.

1. Pick one topic your feed shows you a lot.
2. Draw three boxes: "I watch", "App learns", "App shows more". Join them with arrows in a circle.
3. Next to the circle, write two things you might be **missing** because of this bubble.
4. Bonus: add one arrow that could **break** the loop. What could you do that pushes the feed in a different direction?

You are done when your map has a full circle of arrows and one way to break it.

**Reflect:** is there a bubble in your feed that you actually enjoy, and one you would like to pop?`,
        microCheck: [
          {
            question: "Why is a filter bubble called a reinforcing loop?",
            options: [
              "Because the app stops learning once it knows you",
              "Because each turn of the loop makes the next stronger",
              "Because your friends reinforce the videos you like",
              "Because the app resets your feed at the end of each day",
            ],
            correctIndex: 1,
            explanation:
              "In a reinforcing loop, the result feeds back and pushes the same way again: watch more, get shown more, watch even more. That is why bubbles grow over time.",
          },
          {
            question: "Lina only sees videos agreeing with one side of an argument. What is the biggest risk?",
            options: [
              "Her phone will slow down from too many similar videos",
              "She may think nearly everyone agrees with that side",
              "The app will delete videos that disagree with that side",
              "She will be charged extra for watching the same topic",
            ],
            correctIndex: 1,
            explanation:
              "A bubble can make one view feel like everyone's view. The other side's videos still exist; she just is not being shown them.",
          },
          {
            question: "Which drawing is the best systems map of a filter bubble?",
            options: [
              "I watch, then the app learns, then the app shows more, then back to I watch",
              "A list of my five favourite videos in order from best to worst",
              "A straight line from I open the app to I close the app",
              "A pie chart showing how many hours I spend on each app",
            ],
            correctIndex: 0,
            explanation:
              "The bubble is a loop, so its map is a circle of arrows where the end feeds back into the start. A list, a line or a pie chart does not show the loop.",
          },
          {
            question: "Is a filter bubble always a bad thing?",
            options: [
              "Yes, any feed focused on one topic is harmful",
              "No, but it can hide topics and views you would value",
              "No, because the app always shows a fair mix of views",
              "Yes, because bubbles are made on purpose to trick you",
            ],
            correctIndex: 1,
            explanation:
              "A bubble of something you love can be fine. The risk is what it quietly leaves out. Bubbles usually grow from the loop itself, not from someone planning to trick you.",
          },
        ],
      },
      {
        title: "Why it is so hard to stop scrolling",
        objective: "Spot three design features that keep you scrolling and use the 5 Whys to find the root cause of a long scroll.",
        durationMinutes: 11,
        contentType: "article",
        bodyMd: `## Learn: the app is designed to keep you

Have you ever opened an app "for one minute" and looked up half an hour later? That is not because you lack willpower. Many apps are carefully designed to keep you there.

Here is why. Many free apps make money from **adverts**. The longer you stay, the more adverts they can show. So the app's goal is often your **attention**: time spent and coming back. That shapes the design. Look for these features:

- **Endless scroll**: there is no bottom of the page, so there is never a natural place to stop. A book has chapters. A feed does not.
- **Autoplay**: the next video starts before you decide whether you want it.
- **Surprise rewards**: you never know if the next video will be amazing or boring. That "maybe the next one" feeling is powerful. It is the same pull as opening a mystery box in a game.
- **Notifications**: buzzes and red dots that pull you back in.
- **Streaks**: "Don't lose your 40-day streak!" turns opening the app into a duty.

None of these features is evil on its own. A notification about your football training time is useful. But together they make stopping hard, so it helps to see them clearly.

## Play: ask why, five times

The **5 Whys** is a thinking tool for finding the real cause of a problem. You ask "Why?" and then ask "Why?" about the answer, about five times, until you reach something you can change.

Here is Tobi's example, from Kano:

1. Why was I late with homework? *I scrolled for 45 minutes.*
2. Why did I scroll so long? *Each video led straight into the next.*
3. Why didn't I stop? *There was never a moment where it ended.*
4. Why was there no end? *Autoplay and endless scroll were on.*
5. Why was I on the app at homework time? *I picked up my phone to check one message.*

Tobi's root cause is not "I'm bad at stopping". It is "my phone sits next to my homework and the app has no stopping points". That is something he can fix.

Try it with the AI on this page:

\`\`\`try
Play the 5 Whys game with me. My problem is: [DESCRIBE A TIME YOU STAYED ON AN APP LONGER THAN YOU MEANT TO, WITHOUT NAMES OR PERSONAL DETAILS]. Ask me "Why?" one question at a time, wait for my answer, and after five whys help me name the root cause and one small change I could try. Keep it friendly and short.
\`\`\`

## Thinking tool: design features, not blame

When something keeps happening, systems thinkers look at the **design** around a person, not just the person. If a road has lots of crashes, you look at the bends and the signs, not only the drivers. Your scrolling works the same way. Change the design around you and the behaviour changes.

## Try it now

Go on a **design feature hunt** (you can do this from memory, no need to open an app).

1. Pick one app you use a lot.
2. Find three features that keep you using it: endless scroll, autoplay, streaks, notifications, surprise rewards or something else.
3. For each one, write one way to **switch it off or work around it**. For example: "Autoplay: turn it off in settings" or "Phone in another room during homework".

You are done when you have three features and three workarounds. You decide which ones to use.

**Reflect:** which feature pulls on you the most, and why do you think it works so well?`,
        microCheck: [
          {
            question: "Why do many free apps want you to stay on them for a long time?",
            options: [
              "More time on the app usually means more adverts shown",
              "The law says apps must keep people busy for an hour",
              "Phones charge faster when an app is kept open",
              "Long sessions help the app delete old videos",
            ],
            correctIndex: 0,
            explanation:
              "Many free apps earn money from adverts, so your attention is valuable to them. That is why so many features push you to stay and come back.",
          },
          {
            question: "Which feature removes the natural place where you might decide to stop?",
            options: [
              "A setting that shows your total screen time",
              "Endless scroll with no bottom to the page",
              "A search box where you type what you want",
              "A button to mark a video as not interested",
            ],
            correctIndex: 1,
            explanation:
              "Endless scroll means there is never an end of the page, so there is no built-in stopping point. The other options give you more control, not less.",
          },
          {
            question: "Ama uses the 5 Whys on 'I stayed up late watching videos'. Which final answer is the most useful root cause?",
            options: [
              "I am just bad at self-control and always will be",
              "Videos are too interesting for anyone to resist",
              "My phone charges next to my bed with autoplay on",
              "The app wanted me to stay up late on purpose",
            ],
            correctIndex: 2,
            explanation:
              "A good root cause is something you can change, like where the phone charges or a setting. Blaming yourself or the videos leaves you with nothing to act on.",
          },
          {
            question: "What makes 'surprise rewards' in a feed so powerful?",
            options: [
              "Every video is guaranteed to be better than the last one",
              "Not knowing if the next one is great keeps you swiping",
              "The app pays you a reward for each video you watch",
              "Surprise videos are always shorter than other videos",
            ],
            correctIndex: 1,
            explanation:
              "The 'maybe the next one will be amazing' feeling is the pull, like a mystery box in a game. Not every video is good, and you are not paid for watching.",
          },
        ],
      },
      {
        title: "Take back the controls",
        objective: "Use first principles to decide what you want a feed to do for you, and choose three moves that steer it there.",
        durationMinutes: 12,
        contentType: "article",
        bodyMd: `## Learn: you can steer the algorithm

Good news: the same loop that builds a bubble can be used to escape one. The app learns from your signals, so if you change your signals, you change your feed. You are not just a passenger. You can be the driver.

Here are moves that work on many apps (names and settings differ, so explore your own):

- **Search on purpose.** Type in a topic you want more of: science experiments, drawing tutorials, a new football league. Searches are strong signals.
- **Use "Not interested".** Many apps have this option. It is a clear signal: less of this, please.
- **Follow for variety.** Follow a few creators who make something different from your usual feed.
- **Do not hate-watch.** Watching something to the end because it annoys you still tells the app "more of this". Swipe away instead.
- **Turn off autoplay** where you can, so you choose each next video.
- **Set a stopping point.** A timer, or a rule like "three videos, then I go outside".
- **Reset.** Some apps let you clear your watch history or refresh your feed. Check the settings with a parent or carer.

## Thinking tool: first principles

**First principles** means going back to the most basic question before you decide anything. Instead of "how do I use this app?", ask "what do I actually want from it?"

Maybe you want: to laugh, to learn guitar, to keep up with your friends, to get better at football. A feed that does those things is working for you. A feed that leaves you tired and grumpy is not. Start from what you want, then build your moves from there.

## Play: break the bubble

In this tool, a viewer is stuck in a bubble. Use only the moves you just learned (searching, skipping, following, "not interested") to get variety back into their feed in as few steps as you can.

\`\`\`studio
feed-simulator:break-the-bubble
\`\`\`

Which move worked fastest? Which one did almost nothing?

## Try it now

Design your **Feed Plan**. Use the AI on this page to help you think it through:

\`\`\`try
Help me make a Feed Plan. Ask me these questions one at a time and wait for my answers: 1) What do I want more of in my feed? 2) What do I want less of? 3) When do I most often scroll longer than I meant to? Then suggest three small moves I could try this week, using things like searching on purpose, "not interested", following new creators, turning off autoplay or setting a stopping point. Do not ask for my name, my school or any account details.
\`\`\`

Then write your plan on paper:

1. **My goal**: one sentence about what you want your feed to do for you.
2. **Three moves**: the three you will try this week.
3. **My check**: how you will know in a week if it worked. For example: "At least half my feed is guitar and science."

You are done when your plan has a goal, three moves and a check. Show it to someone at home if you like, and tell them how a feed learns.

**Reflect:** after this module, who do you think is more in charge of your feed: you or the app? What would make it more you?`,
        microCheck: [
          {
            question: "Sipho keeps watching annoying prank videos to the end so he can complain about them. What happens?",
            options: [
              "The app sees he dislikes them and shows fewer",
              "The app sees long watches and shows him more",
              "Nothing changes unless he writes a comment",
              "The app blocks the creator from his feed",
            ],
            correctIndex: 1,
            explanation:
              "Watch time is a strong signal and the app cannot tell annoyed watching from happy watching. Swiping away or using 'not interested' sends the message he actually means.",
          },
          {
            question: "Which question is the best first-principles starting point for your feed?",
            options: [
              "Which app has the most videos in the world?",
              "What do I actually want my feed to do for me?",
              "How do I get more followers on my own account?",
              "Which video is trending in my country today?",
            ],
            correctIndex: 1,
            explanation:
              "First principles start from the basic purpose. Once you know what you want from a feed, you can choose the moves that steer it there.",
          },
          {
            question: "Mariam wants more science videos in her feed. Which move sends the clearest signal?",
            options: [
              "Scrolling faster past every video she sees",
              "Searching for science topics she enjoys",
              "Turning her phone off and on again",
              "Watching her usual videos for even longer",
            ],
            correctIndex: 1,
            explanation:
              "Searching for a topic is a strong, direct signal. Scrolling fast past everything or restarting the phone tells the app little about science.",
          },
          {
            question: "Why does changing your signals change your feed?",
            options: [
              "Because the app learns from what you do, so new actions teach it",
              "Because apps reset everyone's feed at the start of each week",
              "Because a human checks your account and edits it by hand",
              "Because your phone sends your feed plan to the app's team",
            ],
            correctIndex: 0,
            explanation:
              "The feed is built from your signals. Send different signals for a while and the loop starts pushing in a new direction. No human edits it for you.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Abena likes one cat video but watches a long football video to the end twice. Which topic will the app probably push more?",
        options: [
          "Cats, because a like always counts more than anything",
          "Football, because long watches and replays are strong",
          "Neither, because she sent mixed signals on both topics",
          "Both equally, because she showed interest in both",
        ],
        correctIndex: 1,
        explanation:
          "Watch time and rewatches are among the strongest signals, often stronger than one like. Apps do not publish exact recipes, but long watching usually counts for a lot.",
      },
      {
        question: "What is a filter bubble?",
        options: [
          "A setting that blocks rude comments on your videos",
          "A narrow feed shaped by what you already watched",
          "A special feed made by your school for homework",
          "A bubble icon that appears when a video is popular",
        ],
        correctIndex: 1,
        explanation:
          "A filter bubble is a feed filtered down to what you already like, built by the loop of watching and being shown more of the same.",
      },
      {
        question: "Which pair of features most removes your natural stopping points?",
        options: [
          "Screen time reports and a daily reminder to rest",
          "Autoplay and endless scroll working together",
          "A search box and a 'not interested' button",
          "Creator profiles and a button to follow them",
        ],
        correctIndex: 1,
        explanation:
          "Autoplay starts the next clip for you and endless scroll has no bottom, so there is never a moment where the feed ends. The other pairs give you more control.",
      },
      {
        question: "Chidi says 'the app shows me what everyone is watching'. What is the best correction?",
        options: [
          "It shows only what is trending in his whole country",
          "It shows a guess based mostly on his own signals",
          "It shows what his teacher has approved for his age",
          "It shows videos in the order they were uploaded",
        ],
        correctIndex: 1,
        explanation:
          "A personal feed is a prediction built mainly from your own signals. Two friends can see very different feeds on the same app at the same time.",
      },
      {
        question: "Which drawing would a systems thinker use to show why a bubble grows stronger?",
        options: [
          "A loop: watch, app learns, app shows more, watch again",
          "A table listing every video watched last week by time",
          "A bar chart comparing likes on five different videos",
          "A timeline of when each app on the phone was installed",
        ],
        correctIndex: 0,
        explanation:
          "The bubble grows because it is a reinforcing loop, so the clearest map is a circle of arrows feeding back into itself.",
      },
      {
        question: "Using the 5 Whys, which root cause gives Musa something he can actually change?",
        options: [
          "Phones are bad and nobody can control them",
          "I have no willpower at all, so it is hopeless",
          "I scroll in bed because my phone charges there",
          "The videos are simply too funny to stop watching",
        ],
        correctIndex: 2,
        explanation:
          "The 5 Whys aims for a cause you can act on. Moving the charger is a real change. Blaming willpower, phones or funny videos leaves nothing to do.",
      },
      {
        question: "Why do many free apps care so much about how long you stay?",
        options: [
          "Longer visits help them show more adverts",
          "Longer visits help your phone's battery last",
          "Longer visits are needed for the app to load",
          "Longer visits are required by school rules",
        ],
        correctIndex: 0,
        explanation:
          "Many free apps are paid for by adverts, so attention is what they sell. That business goal explains a lot of their design choices.",
      },
      {
        question: "Grace wants fewer gossip videos. Which plan is most likely to work?",
        options: [
          "Watch them to the end but leave angry comments",
          "Tap 'not interested' and search for her real hobbies",
          "Close the app quickly every time one appears",
          "Share them with friends to show how silly they are",
        ],
        correctIndex: 1,
        explanation:
          "'Not interested' sends a clear 'less of this' signal, and searching adds new topics. Watching, commenting and sharing all tell the app the gossip videos are working.",
      },
      {
        question: "What does thinking from first principles about your feed mean?",
        options: [
          "Copying the settings your favourite creator uses",
          "Starting from what you actually want a feed to do",
          "Reading every rule in the app's terms of service",
          "Using the very first app you ever downloaded",
        ],
        correctIndex: 1,
        explanation:
          "First principles go back to the basic purpose. Decide what you want from the feed first, then pick the moves that get you there.",
      },
      {
        question: "Is it fair to say that people who scroll a lot simply have weak willpower?",
        options: [
          "Yes, because anyone with willpower can stop easily",
          "No, because the app's design makes stopping harder",
          "Yes, because the apps have no way to influence you",
          "No, because scrolling is always good for everyone",
        ],
        correctIndex: 1,
        explanation:
          "Features like autoplay, endless scroll and streaks are designed to keep people engaged, so looking only at willpower misses the system around the person.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2: Inside the AI brain
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Inside the AI brain",
    summary:
      "Discover how AI learns patterns from examples, what a neural network is (with no maths), why AI makes strange mistakes, how unfair data makes unfair AI, and why AI is neither alive nor magic.",
    lessons: [
      {
        title: "AI learns from examples, not rules",
        objective: "Explain the difference between writing rules and learning from examples, and train a simple classifier with your own examples.",
        durationMinutes: 11,
        contentType: "article",
        bodyMd: `## Learn: how would you teach a mango?

Imagine you have to teach a computer to tell a ripe mango from an unripe one. You could try writing **rules**: "If it is yellow, it is ripe." But some ripe mangoes stay green. Some have red patches. Some are soft but still green. Your rules keep breaking.

So most modern AI does something different. Instead of rules, you give it lots of **examples**: hundreds of photos labelled "ripe" or "not ripe". The AI looks for **patterns** in those examples, like colour, softness or shape, that help it sort them. Then, when you show it a new mango it has never seen, it uses those patterns to make a guess.

This way of building AI is called **machine learning**: the machine learns patterns from examples instead of being given every rule. The examples are called **training data**. The labels ("ripe", "not ripe") are the answers it learns from.

You learned this way too. Nobody gave you a rulebook for recognising your friends' voices. You heard them lots of times and your brain found the pattern.

Here is the important part: **the AI only knows what is in its examples**. If every ripe mango in the training photos was on a blue plate, the AI might learn "blue plate means ripe". It found a pattern, just not the right one.

## Play: teach the machine

In this tool you are the teacher. Give the machine examples of two groups and watch it learn to sort new ones. Try giving it only a few examples first, then lots. What changes?

\`\`\`studio
teach-the-machine:two-classes
\`\`\`

## Thinking tool: first principles

Ask the most basic question: **what does the machine actually get?** It does not get a mango. It gets numbers: the colours of the pixels in a photo. Everything it "knows" comes from patterns in those numbers. Keep that in mind and AI stops looking like magic.

Ask the AI on this page to test you:

\`\`\`try
I am learning that AI learns from examples instead of rules. Give me one everyday sorting job (for example sorting football boots from trainers, or sad songs from happy songs). Ask me to write three rules for it, then show me a tricky case that breaks one of my rules. Then explain in two sentences why learning from examples can handle tricky cases better. Keep it short and friendly.
\`\`\`

## Try it now

Be the training data designer.

1. Choose two groups you could sort: for example, "football" and "basketball" photos, or "happy" and "sad" songs.
2. Write down **six examples** for each group that you would give a machine. Mix them up: different colours, places, sizes, people.
3. Write one **sneaky pattern** the machine might learn by accident if your examples were not mixed up. For example: "All my football photos were outside, so it might think 'grass means football'."

You are done when you have twelve examples and one sneaky pattern.

**Reflect:** what is something you learned from examples rather than rules?`,
        microCheck: [
          {
            question: "What is training data?",
            options: [
              "The examples an AI learns its patterns from",
              "The rules a programmer types in one by one",
              "The battery power an AI uses while it works",
              "The answers an AI gives after it has learned",
            ],
            correctIndex: 0,
            explanation:
              "Training data is the set of examples, usually with labels, that a machine learning system studies to find patterns. It is not a list of hand-written rules.",
          },
          {
            question: "Why is learning from examples often better than writing rules for sorting mangoes?",
            options: [
              "Rules always run far more slowly on a computer",
              "Real mangoes vary too much for simple rules",
              "Examples mean the AI never makes a mistake",
              "Computers are not able to follow any rules",
            ],
            correctIndex: 1,
            explanation:
              "Real things vary in ways simple rules cannot capture, like ripe mangoes that stay green. Examples let the AI find patterns, though it can still make mistakes.",
          },
          {
            question: "Every 'cat' photo in Ade's training data is indoors and every 'dog' photo is outdoors. What might the AI learn?",
            options: [
              "That cats are always smaller than every single dog",
              "That indoors means cat and outdoors means dog",
              "That it needs more photos of birds to work",
              "Exactly how to tell cats and dogs apart",
            ],
            correctIndex: 1,
            explanation:
              "The AI finds whatever pattern sorts the examples. Here the background does the job, so it may learn 'indoors equals cat' instead of what a cat looks like.",
          },
          {
            question: "When an AI looks at a photo of a mango, what does it actually receive?",
            options: [
              "The smell and taste of the mango as data",
              "Numbers describing the colours of the pixels",
              "A short written description of the mango",
              "The name of the farm where it was grown",
            ],
            correctIndex: 1,
            explanation:
              "A photo reaches the AI as numbers for each pixel's colour. Everything it learns comes from patterns in those numbers, which is why it is not magic.",
          },
        ],
      },
      {
        title: "A brain made of tiny dials",
        objective: "Describe a neural network as layers of tiny dials that get nudged when the guess is wrong, and explain it back in your own words.",
        durationMinutes: 12,
        contentType: "article",
        bodyMd: `## Learn: a team of tiny voters

You have probably heard the phrase **neural network**. It sounds like a robot brain. It is actually much simpler, and you can understand it without any maths.

Picture a talent show with a big team of judges. Each judge only looks at one tiny thing. One checks "Is there a strong beat?" Another checks "Is the singer in tune?" Another checks "Is the crowd dancing?" Each judge gives a score, and some judges' opinions count more than others. Add up the scores and you get a decision: "This act goes through!"

A neural network works a bit like that:

- It is made of lots of tiny parts, often called **neurons** (named after brain cells, but much simpler).
- Each one takes in numbers, does a small sum and passes a number on.
- They are arranged in **layers**. Early layers spot simple things, like edges in a photo. Later layers combine those into bigger things, like eyes, then faces.
- Each connection has a **dial** (called a **weight**) that says how much that connection counts.

## How it learns: guess, check, nudge

At the start, all the dials are set randomly, so the network's guesses are rubbish. Then training begins:

1. **Guess.** Show it an example (a photo of a dog) and it makes a guess ("cat").
2. **Check.** Compare the guess with the right answer. Wrong!
3. **Nudge.** Turn the dials a tiny bit so next time the guess is slightly closer to right.

Repeat that thousands or millions of times and the dials end up in positions that give good answers. Nobody sets each dial by hand. The training process does it.

It is like playing "hot and cold". You take a step, someone says "warmer" or "colder", and you adjust. After many steps you find the hidden object.

## Play: a human neural network

You can play this as an unplugged game with two or three friends or family members. Person one only looks at **colour**, person two only looks at **shape**, person three adds up their votes and shouts the final guess: "apple" or "orange". Show them fruit (or pictures) and when they get it wrong, the adder decides whose vote should count more next time. That is the "nudge".

No friends nearby? Ask the AI on this page:

\`\`\`try
Explain how a neural network learns using a football example, for someone aged [YOUR AGE]. Use the idea of tiny dials that get nudged after each wrong guess. Keep it under 120 words. Then ask me to explain it back to you in my own words, and tell me what I got right and what I missed.
\`\`\`

## Thinking tool: explain it back

Remember: if you can explain it simply, you understand it. When the AI asks you to explain it back, do not copy its words. Use your own example, like music, cooking or a game.

## Try it now

Make a **one-page comic** (four boxes) called "How a neural network learns".

1. Box 1: the network sees an example.
2. Box 2: it makes a guess.
3. Box 3: it is told whether it was right or wrong.
4. Box 4: tiny dials get nudged.

Use any example you like: spotting your team's kit, sorting rubbish for recycling, recognising a song. You are done when someone else can read your comic and tell you the three steps.

**Reflect:** what is one way a neural network's learning is like yours, and one way it is different?`,
        microCheck: [
          {
            question: "In a neural network, what is a weight?",
            options: [
              "A dial that sets how much one connection counts",
              "The total size of the AI's file on the computer",
              "How heavy the computer running the AI is",
              "The number of examples in the training data",
            ],
            correctIndex: 0,
            explanation:
              "Weights are the network's dials. Training adjusts them so the network's guesses get closer to the right answers.",
          },
          {
            question: "What are the three steps of training, in order?",
            options: [
              "Guess, check against the answer, nudge the dials",
              "Copy the answer, save it, then show it to the user",
              "Ask a human, wait, type in the human's answer",
              "Search the internet, pick a page, read it out",
            ],
            correctIndex: 0,
            explanation:
              "The network guesses, the guess is compared with the right answer, and the dials are nudged a tiny bit. Repeating that many times is how it learns.",
          },
          {
            question: "Who sets each dial in a big neural network?",
            options: [
              "A team of people who set every dial by hand",
              "The training process, through many small nudges",
              "The user, each time they ask the AI a new question",
              "Nobody, because the dials never change at all",
            ],
            correctIndex: 1,
            explanation:
              "There are far too many dials to set by hand. Training nudges them automatically, a tiny bit after each example.",
          },
          {
            question: "Why is the 'hot and cold' game a good picture of training?",
            options: [
              "Because the AI gets physically warmer as it learns",
              "Because small steps plus feedback slowly find the answer",
              "Because the AI already knows where the answer is hidden",
              "Because training only works when someone is shouting",
            ],
            correctIndex: 1,
            explanation:
              "In both, you take a step, get told 'warmer' or 'colder', and adjust. Many small corrections add up to finding the target.",
          },
        ],
      },
      {
        title: "Why AI gets it wrong",
        objective: "Use a debugging mindset to find why an AI made a mistake: missing examples, shortcuts or something it never saw before.",
        durationMinutes: 11,
        contentType: "article",
        bodyMd: `## Learn: three ways AI gets fooled

AI can do amazing things, and it can also make mistakes no person would make. Once you know why, those mistakes stop being mysterious. Most come from three causes.

**1. It never saw anything like it.** If an AI learned to spot footballs from photos of white balls with black patches, it might get confused by a bright orange ball. It is not stupid. It just never met an orange ball in training.

**2. It learned a shortcut.** Remember the mango on the blue plate? An AI finds whatever pattern sorts its examples, even a silly one. Imagine an AI trained to spot wolves where every wolf photo had snow in the background. Show it a husky dog in the snow and it might shout "wolf!" It learned "snow", not "wolf".

**3. The examples were wrong or too few.** If some photos were labelled wrongly, or there were only ten of them, the patterns it learned will be shaky.

There is a fourth thing to know: AI usually **does not know when it is wrong**. It often gives a wrong answer just as confidently as a right one.

## Thinking tool: the debugging mindset

When code or a machine does something odd, programmers do not say "it's broken, forget it". They **debug**: they get curious and investigate.

1. **What happened?** Describe the mistake exactly.
2. **What did I expect?** Say what should have happened.
3. **Why might it have happened?** Make a guess, called a **hypothesis**.
4. **Test it.** Change one thing and see if the mistake goes away.

A mistake is a clue, not a disaster.

## Play: trick the machine

In this tool, your job is to find inputs that fool a trained machine. Then work out **why** it was fooled. Was it something it never saw, or a shortcut it learned?

\`\`\`studio
teach-the-machine:trick-it
\`\`\`

You can also try the debugging mindset with the AI on this page. Chatbots make mistakes too:

\`\`\`try
I am practising my debugging mindset. Give me three short facts about [A TOPIC YOU KNOW REALLY WELL, LIKE YOUR FAVOURITE GAME OR SPORT]. Make one of them subtly wrong on purpose but do not tell me which. I will try to find it and explain why it is wrong. After I answer, tell me if I was right.
\`\`\`

## Try it now

Write a **bug report** for an AI mistake. Use one from the trick-it tool, or imagine this one: *a music app's AI keeps calling every song with drums "rock", even gentle highlife songs.*

1. **What happened:** describe the mistake in one sentence.
2. **What I expected:** one sentence.
3. **My hypothesis:** which of the three causes do you think it is, and why?
4. **My test:** what change to the training examples would show if you are right?

You are done when your bug report has all four parts.

**Reflect:** next time an AI tool gets something wrong, what will you ask yourself first?`,
        microCheck: [
          {
            question: "An AI trained only on photos of white footballs fails to spot an orange one. What is the most likely cause?",
            options: [
              "It never saw orange balls in its training examples",
              "It is broken and will need to be thrown away for good",
              "Orange is a colour that computers cannot see",
              "Someone hacked it to ignore orange objects",
            ],
            correctIndex: 0,
            explanation:
              "AI learns from what it was shown. With no orange balls in training, it has no pattern for them. Adding varied examples is the usual fix.",
          },
          {
            question: "An AI calls a husky in the snow a 'wolf'. Which cause fits best?",
            options: [
              "It never saw any animals during training",
              "It learned the shortcut that snow means wolf",
              "Huskies and wolves are really the very same animal",
              "It was trained to always guess wolf",
            ],
            correctIndex: 1,
            explanation:
              "If wolf photos mostly had snow, the AI may have learned the background instead of the animal. That is a shortcut pattern.",
          },
          {
            question: "What does the debugging mindset ask you to do first when an AI makes a mistake?",
            options: [
              "Give up and use a different tool instead",
              "Describe exactly what happened versus what you expected",
              "Delete all the training data and start again",
              "Tell all your friends that AI is always wrong about everything",
            ],
            correctIndex: 1,
            explanation:
              "Debugging starts by describing the mistake clearly and comparing it with what should have happened. Then you form and test a hypothesis.",
          },
          {
            question: "Why is it risky that AI often sounds just as sure when it is wrong?",
            options: [
              "Because sounding sure makes it run more slowly",
              "Because you cannot use its confidence to tell right from wrong",
              "Because it only sounds sure when it is actually right",
              "Because confident answers cost more money to make",
            ],
            correctIndex: 1,
            explanation:
              "If wrong answers sound as sure as right ones, confidence tells you nothing. You need to check important answers in other ways.",
          },
        ],
      },
      {
        title: "Not alive, not magic, and only as fair as its data",
        objective: "Use claim, evidence and reasoning to test a claim about AI, and explain how unfair training data can make an AI unfair.",
        durationMinutes: 12,
        contentType: "article",
        bodyMd: `## Learn: what AI is and is not

Some chatbots say things like "I'd love to help you!" or "That makes me happy." It can feel like there is someone in there. There is not.

A chatbot is a program that has learned patterns from a huge amount of writing. When you type, it builds a reply by predicting likely words, one small piece at a time. The friendly tone is a pattern it learned from human writing, not a feeling. It does not get bored, it does not miss you, and it is not your friend, even when it is helpful.

It is not magic either. Everything it does comes from **data** (the examples), **training** (the nudging of dials) and **computing power**. When something seems magical, ask: "Where did it learn this from?"

## Learn: unfair data makes unfair AI

Because AI learns from examples, it copies whatever is in them, including what is **missing**. Imagine a face filter trained mostly on photos of people with light skin. It might work well for them and badly for people with darker skin. Nobody meant to be unfair. The training data was just unbalanced.

Or imagine a "best footballer" AI trained only on clips from men's leagues. Ask it about great players and it might never mention women's football. The data left them out, so the AI does too.

That is why people who build AI need to ask: "**Who is in my data, and who is missing?**"

## Play: build a fair dataset

In this tool, check a training set for who and what is missing, then fix it so the machine works well for everyone.

\`\`\`studio
teach-the-machine:fair-data
\`\`\`

## Thinking tool: claim, evidence, reasoning

When someone says something about AI, test it with **claim, evidence, reasoning** (CER):

- **Claim**: what are they saying? "My chatbot is my best friend."
- **Evidence**: what facts support or challenge it? "It says nice things. But it has no feelings and does not know me outside our chats."
- **Reasoning**: how does the evidence connect to the claim? "Friendship needs two people who care. The chatbot predicts friendly words, so it is a helpful tool, not a friend."

Practise with the AI on this page:

\`\`\`try
Let's practise claim, evidence, reasoning. Here is a claim about AI: "[PICK ONE: AI is alive / AI is always right / AI is magic / AI is the same for everyone]". Ask me for my evidence and my reasoning, one step at a time. Then tell me how strong my argument was and give me one extra piece of evidence I could add.
\`\`\`

## Try it now

Make a **myth-buster poster** (on paper or as a drawing).

1. Write one common myth about AI in big letters, for example "AI is alive" or "AI is always fair".
2. Underneath, write your **evidence** (two facts from this module).
3. Write your **reasoning** in one sentence: why the evidence busts the myth.
4. Add a "Truth" box: what AI really is, in one sentence of your own.

You are done when your poster has a claim, two pieces of evidence, reasoning and a truth box.

**Reflect:** if you could ask the people who build an AI one question about their training data, what would it be?`,
        microCheck: [
          {
            question: "A chatbot says 'I missed you!' What is really happening?",
            options: [
              "It predicts friendly words it learned from writing",
              "It felt lonely while you were away from the app",
              "It is secretly a real person typing the reply",
              "It remembers you just the way a best friend would",
            ],
            correctIndex: 0,
            explanation:
              "A chatbot produces likely words based on patterns in human writing. The warmth is a style, not a feeling, and it is not a person.",
          },
          {
            question: "A face filter works well for some faces and badly for others. What is a likely cause?",
            options: [
              "The training photos did not include enough variety of faces",
              "Some faces are simply too complicated for any computer",
              "The filter randomly picks which faces it will work on",
              "The people it fails on are holding their phones the wrong way",
            ],
            correctIndex: 0,
            explanation:
              "AI works best on what it saw in training. If some groups were missing or rare in the data, it may work poorly for them.",
          },
          {
            question: "In claim, evidence, reasoning, what is the reasoning part?",
            options: [
              "The claim said again in a louder way",
              "How the evidence connects to the claim",
              "A list of people who agree with the claim",
              "The source where you found the evidence",
            ],
            correctIndex: 1,
            explanation:
              "Reasoning explains why the evidence supports or challenges the claim. Without it, evidence is just a pile of facts.",
          },
          {
            question: "Which question best helps make an AI fairer?",
            options: [
              "How can we make the AI answer more quickly?",
              "Who is in our training data, and who is missing?",
              "How can we make the AI sound more confident?",
              "Which colour should the AI's app button be painted?",
            ],
            correctIndex: 1,
            explanation:
              "AI copies the patterns and gaps in its data. Checking who is included and who is missing is the starting point for fairness.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "What is the main difference between a rule-based program and machine learning?",
        options: [
          "Machine learning finds patterns from examples instead",
          "Rule-based programs can only be used for maths homework",
          "Machine learning never needs any data to get started",
          "Rule-based programs are always smarter and more correct",
        ],
        correctIndex: 0,
        explanation:
          "In machine learning, the program studies examples and finds patterns. In a rule-based program, a person writes every rule. Both can be useful.",
      },
      {
        question: "Efua trains a 'ripe banana' AI, but all her ripe photos were taken in her kitchen. What could go wrong?",
        options: [
          "The AI may learn 'kitchen' instead of 'ripe'",
          "The AI will refuse to look at banana photos",
          "The AI will work perfectly in every single place",
          "The AI will only recognise green bananas",
        ],
        correctIndex: 0,
        explanation:
          "If the background always matches the label, the AI may use the background as a shortcut. Mixing up where photos are taken helps it learn the right pattern.",
      },
      {
        question: "Which is the best simple description of how a neural network learns?",
        options: [
          "It guesses, checks, and nudges many tiny dials",
          "It reads a rulebook that a programmer wrote",
          "It copies the answers from the person who is using it",
          "It grows new brain cells like a human does",
        ],
        correctIndex: 0,
        explanation:
          "Training repeats guess, check and nudge many times. The dials (weights) slowly move to positions that give good answers.",
      },
      {
        question: "What do the early layers of an image network usually detect?",
        options: [
          "Simple things like edges and patches of colour",
          "Whole objects like faces, cars and footballs",
          "The name of the person who took the photo",
          "Whether the photo was liked by many people",
        ],
        correctIndex: 0,
        explanation:
          "Early layers pick up simple features; later layers combine them into bigger shapes and whole objects.",
      },
      {
        question: "An AI is confident and wrong. What should you take from that?",
        options: [
          "Its confidence does not tell you if it is right",
          "It must have been hacked by someone else",
          "Confident answers are always the true ones",
          "You should always trust its second answer instead",
        ],
        correctIndex: 0,
        explanation:
          "AI often sounds equally sure whether it is right or wrong, so confidence is not evidence. Check important answers elsewhere.",
      },
      {
        question: "Using the debugging mindset, what comes after forming a hypothesis?",
        options: [
          "Test it by changing one thing and checking",
          "Tell everyone the AI is useless and broken",
          "Ask the AI if it agrees with your hypothesis",
          "Keep using the AI and hope it fixes itself",
        ],
        correctIndex: 0,
        explanation:
          "A hypothesis is a guess you test. Changing one thing at a time shows whether your guess about the cause was right.",
      },
      {
        question: "A 'best footballer' AI never mentions women players. What is the most likely reason?",
        options: [
          "Its training data left women's football out",
          "It decided by itself that women cannot play",
          "Women's football has no famous players at all",
          "It was too busy to look at more examples",
        ],
        correctIndex: 0,
        explanation:
          "AI copies the gaps in its data. If women's football was missing from training, the AI leaves it out too. It has no opinions of its own.",
      },
      {
        question: "Why is a chatbot not your friend, even when it is kind?",
        options: [
          "It predicts friendly words but has no feelings",
          "It is only friendly to people over eighteen",
          "It is a friend, but only on certain apps",
          "It stops being kind after a few messages",
        ],
        correctIndex: 0,
        explanation:
          "Friendship needs someone who actually cares. A chatbot produces friendly text from patterns in writing; it does not feel anything about you.",
      },
      {
        question: "Kwame claims 'AI is magic'. Which piece of evidence best challenges that claim?",
        options: [
          "AI learns patterns from data through training",
          "AI can make pictures and write stories",
          "Lots of people use AI every single day",
          "AI answers usually come back within a few seconds",
        ],
        correctIndex: 0,
        explanation:
          "Knowing that AI comes from data, training and computing explains how it works, which is the opposite of magic. Impressive abilities alone do not challenge the claim.",
      },
      {
        question: "A team wants a homework helper AI that works for students in many countries. What should they check first?",
        options: [
          "Whether their data includes students from many places",
          "Whether the app's logo is bright and easy to see",
          "Whether the AI can answer in under one second",
          "Whether the AI uses lots of long, clever words",
        ],
        correctIndex: 0,
        explanation:
          "An AI tends to work best for the people well represented in its training data. Checking who is included is the first fairness step.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 3: AI in your games and phone
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "AI in your games and phone",
    summary:
      "Look inside the AI you meet every day: how game characters chase you and find their way, how camera filters find your face, how voice assistants and autocomplete guess what you mean, and what runs on your phone versus far away in the cloud.",
    lessons: [
      {
        title: "How game characters chase you",
        objective: "Describe how a game character uses simple rules and pathfinding, and map a game as a system of parts and connections.",
        durationMinutes: 12,
        contentType: "article",
        bodyMd: `## Learn: game "AI" is often clever rules

In a game, the characters you do not control are called **NPCs** (non-player characters): the guard who chases you, the shopkeeper, the defender in a football game. People often say they are controlled by "AI". Here is a surprise: many of them do not learn anything. They follow **rules** written by game designers.

A guard might have rules like this:

- **Patrol**: walk between point A and point B.
- **If you see the player**: switch to **Chase**.
- **If you lose the player for 5 seconds**: switch to **Search**.
- **If search finds nothing**: go back to **Patrol**.

Each of those is a **state** (a mode the character is in), and the rules decide when it switches. It feels smart when you play, but it is really a well-designed set of rules. That is still a kind of AI: the old, hand-built kind.

## Learn: finding the way

When the guard chases you, how does it get round walls without bumping into them? It uses **pathfinding**: a method for finding a route from one place to another around obstacles.

Imagine the game map is a grid of squares, like a chessboard. Some squares are walls. The pathfinder starts at the guard's square and checks the squares next to it, then the ones next to those, spreading out like ripples in a pond, until it reaches you. Then it follows the shortest route back. You do the same when you walk to school: you do not walk through houses, you pick the streets that get you there fastest.

## Play: map a system

Games are **systems**: lots of parts connected together. Before mapping a game, warm up with a system you know well: the school lunch queue. What are the parts? What slows it down? What happens if one thing changes?

\`\`\`studio
system-mapper:lunch-queue
\`\`\`

Now try a game. Coins come in, coins go out, prices change. Map how the parts of a game's economy push on each other.

\`\`\`studio
system-mapper:game-economy
\`\`\`

## Thinking tool: the systems map

A systems map shows **parts** and the **arrows** between them. Ask: what goes in? What comes out? What happens if I change one part? In a game, changing one rule (guards walk faster) can change everything else (the level becomes too hard, players quit).

## Try it now

Design the **brain of a game character**. No code needed.

1. Pick a character: a goalkeeper, a shopkeeper, a pet in a game, a guard.
2. Write three or four **states** it can be in (for example: "Waiting", "Diving", "Celebrating").
3. For each state, write the **rule** that makes it switch to another state. For example: "If the ball is shot towards the goal, switch from Waiting to Diving."
4. Draw it as boxes (states) with arrows (rules) between them.

You can ask the AI on this page to play your character and test your rules:

\`\`\`try
Pretend to be a game character called [CHARACTER] that follows only these rules: [PASTE YOUR STATES AND RULES]. I will describe things that happen in the game, one at a time. After each one, tell me which state you are in now and why. If my rules do not cover a situation, say "My rules don't say what to do!" so I can fix them.
\`\`\`

You are done when your character has states, rules and at least one situation you had to fix.

**Reflect:** in your favourite game, which character do you think follows rules, and which might use something more complicated?`,
        microCheck: [
          {
            question: "What is an NPC in a game?",
            options: [
              "A character the player does not control",
              "A special power-up that gives extra lives",
              "The name for the game's background music",
              "A player who is new to the game this week",
            ],
            correctIndex: 0,
            explanation:
              "NPC means non-player character: guards, shopkeepers, opponents and other characters the game controls, often with hand-written rules.",
          },
          {
            question: "A guard switches from Patrol to Chase when it sees you. What is this an example of?",
            options: [
              "A rule that changes the character's state",
              "The guard learning from millions of examples",
              "The guard reading the player's thoughts",
              "A random choice the game makes each second",
            ],
            correctIndex: 0,
            explanation:
              "Many game characters use states (Patrol, Chase, Search) and rules for switching between them. It is designed, not learned.",
          },
          {
            question: "What does pathfinding do in a game?",
            options: [
              "Finds a route around obstacles to a target",
              "Finds the player's real-world home address",
              "Finds the fastest internet connection to use",
              "Finds hidden coins and adds them to your score",
            ],
            correctIndex: 0,
            explanation:
              "Pathfinding finds a way from one place to another without walking through walls, much like you choose streets to get to school.",
          },
          {
            question: "A game designer makes every guard twice as fast. Thinking in systems, what else might change?",
            options: [
              "The level could get too hard and players may quit",
              "Nothing else, because only the guards are affected",
              "The game's music will automatically get faster too",
              "The guards will start learning from the players",
            ],
            correctIndex: 0,
            explanation:
              "In a system, changing one part affects others. Faster guards change difficulty, which can change how players feel and whether they keep playing.",
          },
        ],
      },
      {
        title: "How your camera finds your face",
        objective: "Explain the difference between face detection, face filters and face unlock, and say what each one needs to work.",
        durationMinutes: 11,
        contentType: "article",
        bodyMd: `## Learn: finding a face

When you open a camera app and a little box pops up around your face, the phone is doing **face detection**: finding where a face is in the picture. It does not know **who** you are. It just knows "there is a face here".

How? A model was trained on huge numbers of photos with faces marked. It learned the pattern of a face: two eyes, a nose, a mouth, in roughly that layout. Now it scans each camera frame looking for that pattern, many times a second.

**Face filters** go one step further. After finding the face, the app finds **landmarks**: points such as the corners of your eyes, the tip of your nose and the edges of your lips. Then it sticks the dog ears or sunglasses onto those points and moves them as you move. That is why the glasses follow your head when you turn.

Filters sometimes fail: when the light is dim, when your face is half hidden, or, as you learned last module, when the model saw too few faces like yours in training.

## Learn: face unlock is different

**Face unlock** has a harder job. It must decide whether this face is **you**, the phone's owner, and not your brother, your friend or a photo of you. That is **face recognition**: telling one particular person apart from everyone else.

To do that, the phone stores a kind of **number summary** of your face when you set it up. Each time you unlock, it makes a new summary and checks if they match closely enough. Some phones also use special sensors that measure the shape of your face in 3D, which makes it much harder to fool with a flat photo. Phones differ, so a parent or carer can check what yours uses.

## Play: real or fake?

Camera AI can also change faces and make images that look real but are not. Warm up your eye with this quick game: which pictures are real and which were changed or made by a computer?

\`\`\`studio
fake-or-real:warm-up
\`\`\`

How did you decide? Write down one clue you used.

## Thinking tool: first principles

Break it down to basics: **what does the camera actually see?** Just a grid of coloured dots (pixels). Detection, filters and unlock are three different jobs done on those same dots. Asking "what job is this doing?" helps you understand any camera feature.

## Try it now

Be a **camera feature detective**.

1. List three camera features you have seen: a filter, background blur, face unlock, a photo app that groups pictures by face, a QR code scanner.
2. For each one, decide: is it **detecting** a face (where), **following** a face (landmarks) or **recognising** a person (who)? Some might be none of these.
3. For each, write one situation where it might fail.

Check your thinking with the AI on this page:

\`\`\`try
I am sorting camera features into three jobs: face detection (where is a face), face landmarks (following parts of the face), and face recognition (who is this). Here is my list: [YOUR THREE FEATURES AND YOUR ANSWERS]. Tell me which ones I sorted correctly and give me a hint for any I got wrong. Do not ask for any photos.
\`\`\`

You are done when you have three features sorted, each with a way it might fail.

**Reflect:** why do you think face unlock needs to be much more careful than a dog-ears filter?`,
        microCheck: [
          {
            question: "What is the difference between face detection and face recognition?",
            options: [
              "Detection finds a face; recognition works out who it is",
              "Detection works on photos; recognition works on videos",
              "Detection is for adults; recognition is for children",
              "Detection needs the internet; recognition never does",
            ],
            correctIndex: 0,
            explanation:
              "Detection answers 'where is a face?'. Recognition answers 'whose face is this?', which is a much harder job.",
          },
          {
            question: "Why do the sunglasses in a filter stay on your eyes when you turn your head?",
            options: [
              "The app tracks landmarks like your eyes and nose",
              "The app asks you to keep your head very still",
              "The app guesses where your eyes will be next week",
              "The app sends each frame to a person who moves them",
            ],
            correctIndex: 0,
            explanation:
              "Filters find landmark points on your face in each frame and attach the effect to them, so the effect moves with you.",
          },
          {
            question: "A filter works badly in a dark room. What is the most likely reason?",
            options: [
              "Dim light makes the face pattern harder to see",
              "Filters are switched off at night by the app",
              "The filter only ever works when the sun is shining",
              "Dark rooms make the phone's battery run out",
            ],
            correctIndex: 0,
            explanation:
              "Face detection relies on seeing the pattern of a face in the pixels. Poor light makes that pattern harder to find.",
          },
          {
            question: "Why can some face unlock systems not be fooled by a flat photo?",
            options: [
              "They use sensors that measure the face's 3D shape",
              "They ask the person to say their password out loud",
              "They only unlock between certain hours of the day",
              "They check whether the photo was printed in colour",
            ],
            correctIndex: 0,
            explanation:
              "A flat photo has no depth. Phones with 3D sensing measure the shape of the face, which a printed photo cannot copy. Not all phones work this way.",
          },
        ],
      },
      {
        title: "Voice assistants and autocomplete: guessing what you mean",
        objective: "Explain how voice assistants and autocomplete predict what you mean, and test a prediction tool to see where it goes wrong.",
        durationMinutes: 11,
        contentType: "article",
        bodyMd: `## Learn: from sound to action

When someone in your family says "Hey, play some music" to a voice assistant, a lot happens in a few seconds:

1. **Listening for the wake word.** The device listens for its special word. Often this first check happens on the device itself.
2. **Speech to text.** After the wake word, it turns the sound of your voice into written words. A model trained on lots of recorded speech does this.
3. **Understanding the request.** It works out what you want: the action ("play"), and the details ("music", "Afrobeats", "louder").
4. **Doing it and answering.** It plays the song or speaks a reply, using text to speech.

Each step is a guess. If the room is noisy, if you speak fast, or if the model heard few voices with your accent in training, it can mishear. "Play Burna Boy" might become something very strange. That is not the assistant being rude. It is a prediction gone wrong.

## Learn: autocomplete is a prediction machine

When you type "I'm on my" and your phone suggests "way", that is **autocomplete**. It predicts the next word based on patterns: what most people type after those words, and often what **you** usually type. Some keyboards learn your favourite words over time.

Chatbots work on a similar idea, but much bigger: predicting one piece of text after another. That is why they can write whole paragraphs, and also why they can confidently write things that are not true.

## Play: break the prediction

Use the AI on this page to see prediction in action. It is a chatbot, so it is predicting words too:

\`\`\`try
Let's play a prediction game. I will give you the start of a sentence and you give me the three most likely next words, with a guess at how likely each one is. Then I will try to find a sentence where your top guess is wrong. My first sentence start is: "[START OF A SENTENCE, LIKE: After school I usually]"
\`\`\`

Try a few. Can you find a sentence where the most likely word is not what **you** would say? That shows the model predicts what is common, not what is true about you.

## Thinking tool: explain it back

Explain to someone at home, in under one minute, what happens when they talk to a voice assistant. Use the four steps. If you get stuck on a step, that is the one to reread.

## Try it now

Run a **voice and typing experiment** (with a parent or carer's permission if you use a family device, and never say personal details like your address).

1. Type the start of three sentences on a phone keyboard and write down what autocomplete suggests.
2. Change one word and see how the suggestions change.
3. If your family has a voice assistant, ask it the same simple question (like "What is the weather?") in a normal voice, a fast voice and a quiet voice. Write down what happened.
4. Write one sentence explaining **why** it got something wrong, using the idea of prediction.

You are done when you have results from at least three tests and one explanation.

**Reflect:** autocomplete suggests what is common. When might "common" not be right for you?`,
        microCheck: [
          {
            question: "What does the speech-to-text step of a voice assistant do?",
            options: [
              "Turns the sound of your voice into written words",
              "Turns written words into a voice that speaks back",
              "Checks whether you are allowed to use the device",
              "Chooses which song is most popular this week",
            ],
            correctIndex: 0,
            explanation:
              "Speech to text converts sound into words, so the assistant can work out what you want. Text to speech is the reverse, used for its reply.",
          },
          {
            question: "Why might a voice assistant mishear someone with a strong accent?",
            options: [
              "It heard few voices like theirs during training",
              "It is programmed to ignore people it dislikes",
              "Accents change the language the device speaks",
              "It only listens to voices in a quiet library",
            ],
            correctIndex: 0,
            explanation:
              "Speech models learn from recorded voices. If some accents were rare in training, the model's guesses for them are weaker.",
          },
          {
            question: "Autocomplete suggests 'way' after 'I'm on my'. What is it doing?",
            options: [
              "Predicting a likely next word from typing patterns",
              "Reading your mind to find the word you are thinking",
              "Looking up the correct grammar rule in a textbook",
              "Copying a message a friend sent you last week",
            ],
            correctIndex: 0,
            explanation:
              "Autocomplete predicts likely next words from patterns in lots of typing, and sometimes from your own habits. It cannot read your mind.",
          },
          {
            question: "How are chatbots and autocomplete alike?",
            options: [
              "Both predict likely text that comes next",
              "Both always check facts before answering",
              "Both only work when you speak out loud",
              "Both are controlled by a person typing live",
            ],
            correctIndex: 0,
            explanation:
              "Both predict text from patterns. Chatbots do it on a much bigger scale, which is why they can write fluently and still be wrong.",
          },
        ],
      },
      {
        title: "On your phone or in the cloud?",
        objective: "Decide whether an AI feature probably runs on your device or in the cloud, and explain what that means for speed, internet and privacy.",
        durationMinutes: 12,
        contentType: "article",
        bodyMd: `## Learn: two places AI can live

When you use an AI feature, the work happens in one of two places (or a mix):

- **On device**: the AI runs on your phone, tablet or console itself.
- **In the cloud**: your phone sends information over the internet to big computers in a data centre far away. They do the work and send the answer back. "The cloud" sounds fluffy, but it is really buildings full of computers.

Here is how to tell the difference, and why it matters:

| | On device | In the cloud |
|---|---|---|
| Needs internet? | Often no | Yes |
| Speed | Fast, no waiting for the network | Can be slower on a weak connection |
| Power | Limited by your phone | Very big computers |
| Your data | Can stay on your phone | Travels to someone else's computers |

Features that often run on device: face unlock, keyboard suggestions, basic photo sorting, the wake word for a voice assistant. Features that often use the cloud: big chatbots, the full answer from a voice assistant, your video feed's recommendations. It differs between phones and apps, and companies change it over time, so treat this as a guide, not a rule.

A great test: **switch on airplane mode**. If the feature still works, it is probably running on your device.

## Learn: why it matters to you

When data goes to the cloud, it is stored and used by a company. That is why it is smart **never to type or say personal details** into AI tools: your full name, address, school, passwords or photos of friends without asking them. On-device features can be more private, but not always. Reading an app's privacy settings with a parent or carer is a good habit.

## Play: map the loops

Everything in this season connects. Your signals go to the cloud, the feed learns, your phone shows you more, you send new signals. Map these loops in the tool below and find where you can step in.

\`\`\`studio
system-mapper:feedback-loops
\`\`\`

## Thinking tool: claim, evidence, reasoning

Make a claim: "Face unlock runs on my phone." What is your **evidence**? "It works in airplane mode." What is your **reasoning**? "If it needed the cloud, it could not work without internet." That is how scientists and engineers think.

## Try it now

Run the **airplane mode test** (ask a parent or carer first if it is a family phone).

1. Pick four features: keyboard suggestions, face unlock or a fingerprint, a chatbot, a voice assistant, a photo filter, a game.
2. Write a **prediction** for each: on device or cloud?
3. Turn on airplane mode and test each one. Turn it off again afterwards.
4. For each, write a claim, your evidence and your reasoning.

Stuck on a result? Ask the AI on this page:

\`\`\`try
I tested some features in airplane mode. Here are my results: [FEATURE: WORKED OR DID NOT WORK]. For each one, help me reason about whether it probably runs on the device, in the cloud, or a mix. Explain in short sentences for someone aged [YOUR AGE] and remind me that phones and apps differ.
\`\`\`

You are done when you have four predictions, four test results and four claim-evidence-reasoning notes.

**Reflect:** you now know how feeds, AI brains, games and phones work. What is one thing you will do differently with AI because of this season?`,
        microCheck: [
          {
            question: "Your keyboard still suggests words in airplane mode. What is the best conclusion?",
            options: [
              "The suggestions probably run on your device",
              "The suggestions come from a secret satellite",
              "Airplane mode does not turn off the internet",
              "The keyboard is sending your words to the cloud",
            ],
            correctIndex: 0,
            explanation:
              "If a feature works with no internet, it is most likely running on the device. That is the airplane mode test.",
          },
          {
            question: "What is 'the cloud'?",
            options: [
              "Big computers in data centres reached by internet",
              "The weather data that your phone collects daily",
              "A storage space inside your own phone's memory",
              "A special app that cleans up your old photos",
            ],
            correctIndex: 0,
            explanation:
              "The cloud is real computers in data centres. Your device sends data over the internet, they do the work, and the answer comes back.",
          },
          {
            question: "Why might a big chatbot run in the cloud instead of on your phone?",
            options: [
              "It needs far more computing power than a phone has",
              "Phones are not allowed to run any AI at all",
              "The cloud makes it work without needing any internet",
              "Cloud AI never makes any mistakes at all",
            ],
            correctIndex: 0,
            explanation:
              "Large models need huge amounts of computing power, so they usually run on big computers. That also means your messages travel to those computers.",
          },
          {
            question: "Which habit best protects your privacy when using cloud AI?",
            options: [
              "Never sharing personal details like your address",
              "Always typing all of your messages in capital letters",
              "Only using AI tools on the weekend",
              "Turning the screen brightness down",
            ],
            correctIndex: 0,
            explanation:
              "Data sent to the cloud is stored on someone else's computers. Keeping personal details out of AI tools is the simplest, strongest protection.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A guard in a game walks back and forth, then runs at you when you come into view. How does it most likely work?",
        options: [
          "Rules switch it between states like Patrol and Chase",
          "It learned your habits from millions of other players",
          "A person at the game company controls it live",
          "It reads the controller to guess where you will go",
        ],
        correctIndex: 0,
        explanation:
          "Many NPCs follow hand-written rules that switch them between states. That is designed behaviour rather than learning.",
      },
      {
        question: "What is the main job of pathfinding?",
        options: [
          "Finding a route to a target around obstacles",
          "Finding out the player's real name and age",
          "Finding the best music to play in each level",
          "Finding which players are online right now",
        ],
        correctIndex: 0,
        explanation:
          "Pathfinding works out how to get from one place to another without walking through walls, spreading out from the start until it reaches the target.",
      },
      {
        question: "In a game economy, players earn far more coins than before but prices stay the same. What might happen next?",
        options: [
          "Items become too easy to buy and coins feel worthless",
          "Nothing at all, because coins and prices are separate",
          "The game will automatically delete half of the coins",
          "Players will earn fewer coins the more they play",
        ],
        correctIndex: 0,
        explanation:
          "A game economy is a system. More coins flowing in with the same prices means players can buy everything, which changes how the game feels.",
      },
      {
        question: "Which camera feature needs to know WHO you are, not just where your face is?",
        options: [
          "Face unlock on your phone",
          "A filter that adds a crown",
          "A box that frames your face",
          "Background blur in a video",
        ],
        correctIndex: 0,
        explanation:
          "Face unlock must recognise the owner. Filters, face boxes and background blur only need to find where a face or a person is.",
      },
      {
        question: "What are face landmarks?",
        options: [
          "Points like eye corners and the tip of the nose",
          "Famous places where many selfies are taken",
          "The settings you choose in a camera app",
          "Stickers that a filter puts on your photo",
        ],
        correctIndex: 0,
        explanation:
          "Landmarks are key points on the face. Filters track them so effects move with you as you turn and smile.",
      },
      {
        question: "A voice assistant turns 'play highlife' into 'play high life insurance'. What happened?",
        options: [
          "Its speech prediction made a wrong guess",
          "It decided to ignore what the user wanted",
          "Highlife music has been banned on devices",
          "Someone else in the room changed the song",
        ],
        correctIndex: 0,
        explanation:
          "Each step of a voice assistant is a prediction. Unusual words, noise or accents can lead it to guess the wrong words.",
      },
      {
        question: "Why does autocomplete sometimes suggest a word you would never use?",
        options: [
          "It suggests what is common, not what is true for you",
          "It is trying to teach you new words on purpose",
          "It chooses each word at random from a dictionary",
          "It only uses words from old books and newspapers",
        ],
        correctIndex: 0,
        explanation:
          "Autocomplete predicts likely words from lots of people's typing. What is common for most people may not fit you.",
      },
      {
        question: "A feature stops working when you switch on airplane mode. What does that suggest?",
        options: [
          "It probably needs the cloud to do its work",
          "It definitely runs only on your phone",
          "Airplane mode has broken the feature",
          "The feature only works when travelling",
        ],
        correctIndex: 0,
        explanation:
          "If a feature needs an internet connection, it most likely sends data to cloud computers. Features that keep working are likely on the device.",
      },
      {
        question: "What is one advantage of AI running on your device instead of the cloud?",
        options: [
          "Your data can stay on your phone",
          "It is always far more powerful",
          "It never needs any battery power",
          "It can never make a single mistake",
        ],
        correctIndex: 0,
        explanation:
          "On-device AI can keep data on your phone and work without internet. Cloud computers are usually more powerful, and both can make mistakes.",
      },
      {
        question: "Bisi says 'my feed, my phone and my games all have AI, so they all learn about me'. What is the best correction?",
        options: [
          "Some learn from you, but many game characters just follow rules",
          "None of them learn anything, because AI is a marketing word",
          "All of them learn about you every second, even when switched off",
          "Only games learn about you, and phones and feeds never do",
        ],
        correctIndex: 0,
        explanation:
          "Feeds learn from your signals and some phone features adapt to you, but many game characters run on hand-written rules. Different AI works in different ways.",
      },
    ],
  },
];

export const YOUTH_EXPLORER_S1_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-s1-lab-1-my-feed-detective",
    title: "Feed detective: crack your own algorithm",
    labType: "workbench",
    moduleNumber: 1,
    estimatedMinutes: 25,
    points: 50,
    passScore: 60,
    briefMd: `You have learned that your feed is built from your signals, that it can loop into a bubble, and that you can steer it. Now be a **feed detective**.

In this lab you look at a feed (your own, from memory, or the made-up one below), work out which signals built it, draw the loop, and design a plan to make the feed work for **you**.

There are no wrong feeds. You score points for clear thinking: naming real signals, showing the loop, and choosing moves that fit your goal. Do not write your username, your school or anyone's real name.`,
    scenarioMd: `**Want to use a made-up feed instead of your own?** Use this one and say so:

*Jamal is 12 and lives in Nairobi. Last week he watched a few videos of people opening mystery boxes all the way to the end, and replayed two. Now his feed is mostly mystery boxes. He used to like science experiment videos and drawing tutorials, but he hardly sees them now. He often scrolls before bed and loses track of time.*`,
    objectives: [
      {
        id: "signals",
        label: "Names real signals and what the app learned from each",
        weight: 3,
        guidance:
          "Full credit for at least four specific signals (watch time, rewatch, like, share, skip, search, follow, comment or time of day) each linked to what the app probably learned from it. Part credit for two or three signals, or signals with no link to what was learned. Low credit for vague answers like 'it watches me'.",
      },
      {
        id: "loop",
        label: "Describes the feedback loop that built the bubble",
        weight: 3,
        guidance:
          "Full credit for a loop in words or arrows that comes back to the start (for example: watch, app learns, app shows more, watch more) and names what the bubble is pushing out. Part credit for a straight line with no loop back, or a loop with no mention of what is missing.",
      },
      {
        id: "plan",
        label: "Chooses three moves that fit a clear goal",
        weight: 3,
        guidance:
          "Full credit for a one-sentence goal plus three specific moves that match it (search on purpose, not interested, follow new creators, turn off autoplay, set a stopping point, reset history with an adult) and a simple way to check in a week. Part credit for moves that do not match the goal or no way to check. Ignore spelling and grammar; this is a learner aged 10 to 13.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "signals",
          label: "The signals",
          prompt:
            "List four or more signals that built this feed. For each one, write what the app probably learned from it.",
          placeholder: "e.g. Watched mystery box videos to the end: the app learned 'he likes these, show more'...",
          minWords: 30,
        },
        {
          id: "loop",
          label: "The loop",
          prompt:
            "Draw the loop with words and arrows (like A -> B -> C -> back to A). Then write two things the bubble is pushing out of the feed.",
          placeholder: "e.g. Watch mystery boxes -> app learns -> shows more mystery boxes -> watch more -> ...",
          minWords: 25,
        },
        {
          id: "plan",
          label: "My feed plan",
          prompt:
            "Write your goal in one sentence. Then list three moves to steer the feed towards it, and how you will check in one week whether it worked.",
          placeholder: "Goal: ... Move 1: ... Move 2: ... Move 3: ... My check: ...",
          minWords: 35,
        },
      ],
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-s1-lab-2-ai-myth-busters",
    title: "AI myth busters",
    labType: "critique",
    moduleNumber: 2,
    estimatedMinutes: 20,
    points: 50,
    passScore: 60,
    briefMd: `A website for kids has a page called "How AI Works". Some of it is right. Some of it is a **myth**: a thing lots of people believe that is not true.

Read the page carefully, like a detective. Then pick out every statement that is wrong. Be careful: some statements are **correct**, and picking those loses you points. Use what you learned about examples, training data, neural networks, mistakes and fairness.`,
    scenarioMd: `Read the whole page before you choose. For each statement, ask: "What did I learn in this module that proves or busts this?"`,
    objectives: [
      {
        id: "find",
        label: "Finds the planted myths",
        weight: 3,
        guidance: "Credit for each planted myth correctly flagged.",
      },
      {
        id: "precision",
        label: "Does not flag the correct statements",
        weight: 2,
        guidance: "Credit lost for each correct statement flagged as a myth.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `## How AI Works (for curious kids)

AI is everywhere: in your games, your phone and your favourite apps. Here is how it works.

Most modern AI learns from examples. To teach an AI to spot cats, people show it lots of photos labelled "cat" and "not cat", and it finds patterns.

Inside many AI systems is a neural network. It is made of layers of tiny parts connected by dials called weights. During training, the dials are nudged a little each time the AI makes a wrong guess.

Once an AI is trained, it is always right, so you never need to check its answers.

Chatbots have real feelings. When a chatbot says it is happy to see you, it truly is happy.

AI learns everything by itself, like magic, without needing any data.

Training data matters a lot. If an AI only sees certain kinds of faces in training, it may work worse on faces it rarely saw.

Because computers are just maths, AI can never be unfair to anyone.

When an AI makes a mistake, a good first step is to describe what happened and what you expected, then test a guess about why.`,
      flaws: [
        {
          id: "always-right",
          quote: "Once an AI is trained, it is always right, so you never need to check its answers.",
          explanation:
            "AI makes mistakes, and it often sounds just as sure when it is wrong. Checking important answers is always a good idea.",
          category: "overconfidence",
        },
        {
          id: "feelings",
          quote: "Chatbots have real feelings. When a chatbot says it is happy to see you, it truly is happy.",
          explanation:
            "Chatbots predict friendly words from patterns in human writing. The warm tone is a style they learned, not a feeling.",
          category: "fabrication",
        },
        {
          id: "magic",
          quote: "AI learns everything by itself, like magic, without needing any data.",
          explanation:
            "AI learns from data through training. Without examples there are no patterns to learn. It is not magic.",
          category: "fabrication",
        },
        {
          id: "never-unfair",
          quote: "Because computers are just maths, AI can never be unfair to anyone.",
          explanation:
            "AI copies the patterns and gaps in its training data. If some people are missing from the data, it can work worse for them, which is unfair.",
          category: "bias",
        },
      ],
      candidates: [
        { id: "c1", text: "Once an AI is trained, it is always right, so you never need to check its answers.", isFlaw: true, flawId: "always-right" },
        { id: "c2", text: "Chatbots have real feelings and are truly happy to see you.", isFlaw: true, flawId: "feelings" },
        { id: "c3", text: "AI learns everything by itself, like magic, without needing any data.", isFlaw: true, flawId: "magic" },
        { id: "c4", text: "Because computers are just maths, AI can never be unfair to anyone.", isFlaw: true, flawId: "never-unfair" },
        { id: "c5", text: "Most modern AI learns patterns from labelled examples.", isFlaw: false },
        { id: "c6", text: "A neural network's dials (weights) are nudged when it makes a wrong guess.", isFlaw: false },
        { id: "c7", text: "An AI may work worse on faces it rarely saw in training.", isFlaw: false },
        { id: "c8", text: "When AI makes a mistake, describe what happened and test a guess about why.", isFlaw: false },
      ],
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "youth-explorer-s1-lab-3-device-detective",
    title: "Device detective: where does the AI live?",
    labType: "workbench",
    moduleNumber: 3,
    estimatedMinutes: 30,
    points: 60,
    passScore: 60,
    briefMd: `Your phone, tablet or console is packed with AI. In this lab you become a **device detective**: you pick features, work out what job the AI is doing, predict whether it runs on the device or in the cloud, and test your prediction.

You can test a family device (ask a parent or carer first, and switch airplane mode back off when you finish) or use the example list below if you do not have one. Never type personal details, photos or passwords into this lab.

You score points for clear predictions, honest results and good reasoning. A surprising result explained well scores higher than a guess that happened to be right.`,
    scenarioMd: `**No device to test?** Use these made-up results and say so:

*Keyboard suggestions: worked in airplane mode. Face unlock: worked in airplane mode. Chatbot app: did not work in airplane mode. Voice assistant: heard the wake word, then said "I can't connect right now". Photo filter with dog ears: worked in airplane mode. Video app feed: showed only videos already loaded, then stopped.*`,
    objectives: [
      {
        id: "jobs",
        label: "Names what job the AI is doing in each feature",
        weight: 2,
        guidance:
          "Full credit when each of at least four features is matched to a job from the module: predicting text, detecting or tracking a face, recognising a person, turning speech into text, recommending, or rules for a game character. Part credit for two or three. Low credit for 'it uses AI' with no job named.",
      },
      {
        id: "predict-test",
        label: "Makes predictions, then tests them honestly",
        weight: 3,
        guidance:
          "Full credit for a prediction (on device, cloud or a mix) written for each feature and a test result for each, including at least one where the prediction was wrong or the result was mixed, reported honestly. Part credit if predictions and results are mixed together so you cannot tell which came first.",
      },
      {
        id: "reasoning",
        label: "Uses claim, evidence and reasoning",
        weight: 3,
        guidance:
          "Full credit when the conclusion for each feature states a claim, the evidence (the airplane mode result) and reasoning linking them, and notes that some features are a mix (like a wake word heard on device and the answer from the cloud). Part credit for claims with no evidence. Be encouraging; the learner is 10 to 13.",
      },
      {
        id: "privacy",
        label: "Draws one sensible privacy lesson",
        weight: 1,
        guidance:
          "Full credit for one specific, sensible privacy habit linked to the results, such as not saying personal details to a cloud voice assistant or checking settings with an adult. Part credit for a general 'be safe online'.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "jobs",
          label: "Features and their jobs",
          prompt:
            "List four features you will test. For each, write what job the AI is doing (for example: predicting the next word, finding a face, turning speech into text, recommending videos).",
          placeholder: "1. Keyboard suggestions: predicting the next word...",
          minWords: 30,
        },
        {
          id: "predictions",
          label: "My predictions",
          prompt: "Before testing, write your prediction for each feature: on device, in the cloud, or a mix. Give one reason for each.",
          minWords: 30,
        },
        {
          id: "results",
          label: "Test results and claim, evidence, reasoning",
          prompt:
            "Write what happened in airplane mode for each feature. Then, for each, write a claim, your evidence and your reasoning. Which prediction surprised you?",
          minWords: 50,
        },
        {
          id: "privacy",
          label: "My privacy lesson",
          prompt: "Based on your results, write one habit you will use to keep your personal details safe when using AI features.",
          minWords: 15,
        },
      ],
    },
  },
];
