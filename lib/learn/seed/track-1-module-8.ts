import type { SeedModule, SeedQuestion } from "./types";

// Level 1 · Basic, Module 8. Introduces systems thinking and bridges to the
// Intermediate level, which opens by mapping the learner's own workflow.

export const TRACK_1_MODULE_8: SeedModule[] = [
  {
    title: "Seeing the Whole System",
    summary:
      "Learn to see the people, habits, rules and tools around an AI tool, spot feedback loops and knock-on effects, and check the whole picture before you automate anything.",
    lessons: [
      // ─────────────────────────────────────────────────────────────────
      {
        title: "Everything is part of a system",
        objective:
          "Describe a familiar task as a system of parts, connections and purpose, and use the iceberg model to look beneath a recurring problem.",
        durationMinutes: 20,
        bodyMd: `## What a system is

A **system** is a set of parts, connected to each other, that together do something. Three things make one:

- **Parts**: the people, tools, objects and rules involved.
- **Connections**: how the parts affect each other. Who hands what to whom, what waits for what, who hears about a problem.
- **Purpose**: what the whole thing actually achieves. Not always what anyone says it is for.

Think of getting dinner on the table in a busy household. The parts are the people, the fridge, the shopping list, the weekly budget, the cooker and the clock. The connections are things like "whoever shops last decides what we eat" or "nobody checks the fridge before the big shop". The purpose, on paper, is "feed everyone well". In practice it might be "get something edible on the table by seven with the least arguing".

You don't need a diagram to think this way. You need the habit of asking: what else is involved here, and how does it all connect?

## The AI tool is one part, not the whole thing

When you start using an AI tool, it is tempting to think of it on its own: I type, it answers. But the tool always sits inside a bigger system.

Picture a small shop that starts using AI to write replies to customer emails. The system includes:

- the owner and the part-time assistant who read the emails,
- the habit of checking the inbox "when there's a quiet moment",
- the returns policy, which lives in the owner's head,
- the stock spreadsheet that says whether an item is really available,
- the customers, who reply to whatever the email says.

The AI tool can write a lovely reply. But if the returns policy is unwritten, the replies will guess at it. If nobody looks at the stock sheet, the replies may promise items the shop does not have. The tool did its part well. The system still let the customer down.

This is the core idea of the whole module: **the result you get depends on the system, not just the tool.** Improving one part can help, do nothing, or make another part worse.

## The iceberg model

The **iceberg model** is a well-known systems thinking tool for looking beneath a problem. It has four levels, from the most visible to the most hidden.

1. **Events**: what just happened. "A customer got a reply promising a refund we don't offer."
2. **Patterns**: what keeps happening over time. "This is the third wrong refund promise this month."
3. **Structures**: what causes the pattern. The rules, tools, habits and connections. "The returns policy is not written down anywhere, so neither the assistant nor the AI tool can check it."
4. **Mental models**: the beliefs that keep the structure in place. "The policy is obvious, everyone knows it." Or "the AI will know what a normal shop does."

Only the tip, the event, is easy to see. Most of the cause is below the waterline.

## Why fixing an event rarely fixes a pattern

When something goes wrong, the natural reaction is to fix the event. You apologise to the customer, correct the reply and move on. That is fine, and often necessary. But it does nothing about the next wrong reply, because the structure that produced it is untouched.

Here is the same problem handled at each level:

| Level | Response | Does it stop it happening again? |
|---|---|---|
| Event | Apologise and correct this one email | No |
| Pattern | Notice it keeps happening and start looking for why | Not yet, but it points you in the right direction |
| Structure | Write the returns policy down and paste it into the AI prompt every time | Very likely |
| Mental model | Stop assuming "everyone knows the rules" | Stops similar problems elsewhere too |

The deeper you go, the more problems a single change can prevent. The trade-off is that deeper changes take more thought and sometimes a difficult conversation.

A useful rule of thumb: **if you have fixed the same kind of event three times, stop fixing events and look for the structure.**

## Try it now

Take one small, repeated annoyance from your own work or home life. It could be a report that is always late, a shared inbox where messages get missed, or AI drafts you keep having to correct the same way.

Write four short lines, one for each level of the iceberg:

- **Event**: the most recent time it happened.
- **Pattern**: how often it happens, roughly.
- **Structure**: one rule, habit, tool or missing piece that makes it likely.
- **Mental model**: one belief that keeps that structure in place.

You are done when you have all four lines and one idea for a change at the structure level, not the event level. If you like, paste your four lines into an AI tool and ask: "What other structures could be causing this pattern?" Then judge its suggestions yourself.`,
        microCheck: [
          {
            question:
              "A team starts using an AI tool to summarise meetings, but actions still get missed. Which view best fits systems thinking?",
            options: [
              "The tool is one part; hand-offs and habits around it also shape results",
              "The tool must be weak, so switching to a better one will fix the gaps",
              "Meeting notes are a people problem, so the tool should be dropped",
              "Summaries are good enough already; missed actions are nobody's responsibility",
            ],
            correctIndex: 0,
            explanation:
              "The summary is only one step. Whether actions get done depends on who reads it, who owns each action and when it is followed up. Swapping the tool leaves all of that unchanged.",
          },
          {
            question: "Which three things together make up a system?",
            options: [
              "Inputs, outputs and a budget that pays for them",
              "Parts, connections between them and a purpose",
              "People, software and a manager who oversees both",
              "Goals, deadlines and a plan to meet each deadline",
            ],
            correctIndex: 1,
            explanation:
              "A system is parts, the connections between them, and what the whole achieves. The other options list things a system might contain, but miss the connections, which is where most surprises come from.",
          },
          {
            question:
              "A shop keeps sending customers AI replies that promise the wrong refund. Which response works at the structure level of the iceberg?",
            options: [
              "Apologise to each customer and correct the reply by hand",
              "Count how many wrong promises were sent in the last month",
              "Write the returns policy down and include it in every prompt",
              "Tell all the staff to stop believing the AI knows the shop's rules",
            ],
            correctIndex: 2,
            explanation:
              "Writing the policy down changes the structure that produces the errors. Apologising fixes one event, counting reveals the pattern, and challenging a belief works at the mental-model level.",
          },
          {
            question: "Why does fixing an event rarely fix a pattern?",
            options: [
              "Events are too small to matter, so fixing them is wasted effort",
              "Patterns are random, so no single fix can ever prevent them",
              "The structure causing the event is still there to produce the next",
              "Fixing events makes people careless, which then creates new patterns",
            ],
            correctIndex: 2,
            explanation:
              "The same rules, habits and gaps that caused one event will cause the next. Fixing the event is often still needed, but on its own it leaves the cause in place.",
          },
          {
            question:
              "In the iceberg model, which is an example of a mental model rather than a structure?",
            options: [
              "The belief that everyone already knows the policy",
              "A shared inbox with no one assigned to check it",
              "A form that does not ask for the order number",
              "A spreadsheet that is updated only once a week",
            ],
            correctIndex: 0,
            explanation:
              "Mental models are beliefs and assumptions. The inbox, the form and the spreadsheet are structures: the arrangements that those beliefs help keep in place.",
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      {
        title: "Feedback loops and knock-on effects",
        objective:
          "Identify reinforcing and balancing loops, delays and knock-on effects in everyday situations, including your own use of AI.",
        durationMinutes: 25,
        bodyMd: `## Loops: when effects come back around

In a system, cause and effect often go in a circle. A change in one part affects another part, which eventually comes back and affects the first. That circle is a **feedback loop**. There are two kinds, and once you can spot them you will see them everywhere.

## Reinforcing loops: snowballing

A **reinforcing loop** makes a change bigger and bigger in the same direction, like a snowball rolling downhill.

- **Household**: the washing piles up, so there are fewer clean clothes, so more things get worn once and thrown in the basket, so the pile grows faster.
- **Small shop**: good reviews bring more customers, who leave more reviews, which bring more customers. This works in reverse too. Bad reviews drive people away.
- **Team inbox**: the inbox gets behind, so customers chase with follow-up emails, which add to the inbox, which falls further behind.

Reinforcing loops are why things sometimes seem to go from "fine" to "out of control", or from "slow start" to "taking off", faster than you expected.

## Balancing loops: self-correcting

A **balancing loop** pushes things back towards a target, like a thermostat. When the room gets too cold, the heating comes on. When it is warm enough, the heating goes off.

- **Household**: the bank balance drops, so you cut back on spending, so the balance steadies.
- **Small shop**: a queue forms at the till, so a second person opens the other till, so the queue shrinks.
- **Team inbox**: when the unread count goes over a set number, someone stops other work to clear it.

Balancing loops keep things stable. They only work if someone, or something, notices the gap between where things are and where they should be.

Draw your first loop below: link customers and good reviews, choose + or − for each arrow, and decide whether the loop is reinforcing or balancing.

\`\`\`studio
loop-mapper:reviews-loop
\`\`\`

## Delays make loops tricky

A **delay** is a gap in time between an action and its effect. Delays cause a lot of mistakes because people act, see no change, and act again.

The classic example is a shower with a slow boiler. You turn the tap to hot, nothing happens, so you turn it further. Then it arrives scalding, so you swing it back to cold. The delay makes you overshoot in both directions.

With AI, delays show up as problems that take weeks to surface. An error in an AI-drafted document might not be spotted until a customer or a colleague acts on it. By then, the same error may have been copied into several other documents.

Now add the balancing loop that limits that growth, and mark the delay, in the map below.

\`\`\`studio
loop-mapper:capacity-limit
\`\`\`

## Knock-on effects of using AI

A **knock-on effect** (also called a second-order effect) is a consequence of a consequence. The first-order effect of using AI is usually the one you wanted. The knock-on effects are the ones you didn't plan for. Some common ones:

**Drafting gets faster, so checking becomes the slow part.** If drafting a report used to take most of the time, AI shrinks that. But the checking, which used to be a small part of the job, is now where the time goes. Teams that don't plan for this either rush the checking or find the work piles up with the reviewer.

**Everyone using the same tool makes output sound the same.** If every applicant, every supplier and every colleague uses similar tools with similar prompts, their writing starts to blur together. Readers stop noticing it. Your own voice, and your specific facts, become more valuable, not less.

**Trusting outputs you never check lets errors compound.** This is a reinforcing loop. You check less because the tool is usually right. Because you check less, you miss the occasional error. That error gets reused, quoted or built on. Later work inherits it, and the mistake grows with every step it travels.

**More output creates more to read.** If writing is cheap, people write more. Longer emails, more reports, more meeting notes. Someone has to read them, and that someone may start using AI to summarise them. Nobody is actually better informed.

None of these mean "don't use AI". They mean: look one step past the obvious benefit and ask what else changes.

## Try it now

Pick one way you already use AI, or plan to, from anything in this course so far.

1. Write the **first-order effect** in one line: what you expect to get better.
2. Write **two knock-on effects**: what else might change as a result. Think about who checks the work, who receives it, and what happens if everyone does the same.
3. For one of them, decide whether it could become a **reinforcing loop** (snowballing) and what **balancing loop** you could add, such as a quick check, a limit or a regular review.

You are done when you have three lines and one concrete balancing habit you could start this week. If you get stuck, ask an AI tool: "What are the second-order effects of [your use]?" and keep only the ones that apply to your real situation.`,
        microCheck: [
          {
            question:
              "A support inbox falls behind, customers send chasing emails, and the inbox falls further behind. What kind of loop is this?",
            options: [
              "A balancing loop, because the inbox is trying to return to normal",
              "A reinforcing loop, because each delay makes the backlog bigger",
              "A delay, because customers wait before sending their follow-ups",
              "A knock-on effect, because chasing emails are a side consequence",
            ],
            correctIndex: 1,
            explanation:
              "The backlog feeds itself: more delay produces more chasers, which produces more delay. A balancing loop would push the inbox back towards normal, which is not happening here.",
          },
          {
            question: "Which everyday example best describes a balancing loop?",
            options: [
              "A popular café gets busier because busy cafés look appealing",
              "Rumours spread faster the more people have already heard them",
              "A second till opens when the queue passes five people waiting",
              "Clutter builds up because a messy room is harder to tidy",
            ],
            correctIndex: 2,
            explanation:
              "Opening a second till responds to the gap between the queue and an acceptable length and brings it back down. The other three are reinforcing loops that grow in one direction.",
          },
          {
            question:
              "A team starts using AI to draft reports. Drafts now arrive quickly, but reports are still late. What is the most likely knock-on effect?",
            options: [
              "The AI is slower than it looks, so drafting still takes the most time",
              "Reports were never late because of drafting, so nothing has changed",
              "Checking has become the slow step and the reviewer is now overloaded",
              "The team is writing shorter reports, which take longer to approve",
            ],
            correctIndex: 2,
            explanation:
              "When one step speeds up, work piles up at the next one. Faster drafting means more drafts waiting for review, so the reviewer becomes the new slow point.",
          },
          {
            question: "Why can delays cause people to overreact?",
            options: [
              "They act, see no change yet, and act again before the first action lands",
              "Delays make people lose interest, so they stop acting on a problem",
              "They hide the problem completely until it is too late to do anything",
              "Delays only affect machines, so people tend to blame the wrong thing",
            ],
            correctIndex: 0,
            explanation:
              "Like turning a slow shower hotter and hotter, the effect of the first action has not arrived yet. When it does, it arrives on top of the extra actions and overshoots.",
          },
          {
            question:
              "You stop checking an AI tool's summaries because they are usually right. What is the systems risk?",
            options: [
              "The tool will notice it is unchecked and start to become less careful",
              "Rare errors go unnoticed, get reused, and grow as later work builds on them",
              "The summaries will get longer over time because nobody asks for less",
              "You will lose access to the tool if you do not rate its answers each time",
            ],
            correctIndex: 1,
            explanation:
              "Checking is a balancing loop that catches mistakes. Without it, the occasional error travels into other work and compounds. The tool itself does not change its behaviour because you stopped checking.",
          },
        ],
      },

      // ─────────────────────────────────────────────────────────────────
      {
        title: "Before you automate, look around",
        objective:
          "Apply a five-question pre-check to decide whether, and where, handing a task to AI will actually improve the whole process.",
        durationMinutes: 25,
        bodyMd: `## Find the bottleneck first

A **bottleneck** is the slowest step in a process: the one that limits how much the whole thing can get done. The name comes from the narrow neck of a bottle. However wide the bottle is, liquid only pours as fast as the neck allows.

The idea that a process can only go as fast as its slowest step is at the heart of the **theory of constraints**, a well-established approach to improving how work flows. For a beginner, one lesson from it is enough:

**Speeding up a step that is not the bottleneck does not make the whole process faster. It just moves the queue.**

Picture a small bakery that takes custom cake orders by email. The steps are: read the order, reply to confirm, bake, decorate, hand over. Decorating is slow and only one person can do it. Now the bakery uses AI to reply to orders instantly. More orders get confirmed faster, but they all still wait for the one decorator. The pile of confirmed orders grows, customers wait just as long, and some get annoyed because they were promised a quick turnaround. The AI worked perfectly. The system got worse.

Before you speed anything up, ask where work is actually waiting. That is usually the bottleneck.

## Moving work versus removing it

Some automation removes work. Some just moves it somewhere else, often to someone who didn't ask for it.

- **Removing work**: a weekly report nobody reads is stopped entirely. Nothing needs to be drafted, checked or read.
- **Moving work**: AI drafts a long weekly report in seconds. Now your manager spends longer reading it, and you still need to check the figures. The effort moved from you to them, and some of it stayed with you as checking.

A quick test: after the change, who does something new or more than before? If the answer is "someone else", you may have moved the work rather than removed it. That can still be worth doing. Just do it on purpose, and tell the person it lands on.

Sometimes the best "automation" is asking whether the task needs doing at all.

## A five-question pre-check

Before you hand a task to AI, take two minutes with these five questions. They pull together everything in this module.

1. **What is the real goal?** Not the task, the purpose behind it. "Reply to customers" may really be "keep customers happy and coming back". A fast wrong reply fails the real goal.
2. **Where is the slowest step?** If the task you want to speed up is not the bottleneck, the whole process may not get any faster.
3. **Who is affected downstream?** Who receives, checks, reads or acts on the output? Will their work grow?
4. **How would I know if it went wrong?** What check, signal or person would catch a mistake, and how soon? If the honest answer is "I wouldn't", add a check before you start.
5. **What happens if it's wrong?** A clumsy social media caption is easy to fix. A wrong figure in an invoice, a wrong dose or a wrong legal date is not. The worse the consequence, the more checking the task needs, and some tasks shouldn't be handed over at all.

## A worked example

Imagine a team inbox for a local sports club. Someone suggests using AI to answer all member emails automatically.

- **Real goal**: members get correct information about fixtures and fees, and feel looked after.
- **Slowest step**: not writing replies. It's waiting for the treasurer to confirm fee questions, which they do once a week.
- **Downstream**: members act on the replies, and the treasurer handles any mistakes about money.
- **How would we know it went wrong?**: only if a member complained, possibly weeks later. That's a delay.
- **What if it's wrong?**: a wrong fixture time is annoying. A wrong fee amount causes disputes.

The conclusion: automatic replies would speed up a step that isn't slow and add risk around money. A better first move might be a short, written fee list the treasurer approves once, which both people and AI can use. Then AI can help draft fixture replies, with someone glancing over them before sending.

That is a systems answer: change the structure, then decide where AI helps.

## Try it now

Choose one task you would like to hand to AI, at work or at home. Copy the five questions into a note and answer each one in a sentence. Be honest where you don't know.

Then decide on one of three outcomes:

- **Go ahead**, with a named check for question 4.
- **Fix something first**, such as writing down a rule, or dealing with the real bottleneck.
- **Don't automate this one**, because the cost of being wrong is too high.

You are done when you have five answers and one of those three decisions written down. Keep the note. In the next level, you will turn this into a full map of your workflow.`,
        microCheck: [
          {
            question:
              "A bakery uses AI to confirm cake orders instantly, but only one person can decorate. What is the most likely result?",
            options: [
              "Cakes are finished faster because orders now arrive sooner",
              "Confirmed orders pile up waiting for the one decorator",
              "The decorator speeds up because there is more pressure",
              "Customers wait less because they get replies straight away",
            ],
            correctIndex: 1,
            explanation:
              "Decorating is the bottleneck, so faster confirmations just grow the queue in front of it. Customers get a quick reply but the cake takes just as long, or longer.",
          },
          {
            question: "Which change removes work rather than moving it?",
            options: [
              "Using AI to write a long report that the manager then has to read",
              "Using AI to draft emails that a colleague must check before sending",
              "Stopping a weekly report that nobody reads or acts on at all",
              "Using AI to summarise a report so the reader can skim it faster",
            ],
            correctIndex: 2,
            explanation:
              "Stopping an unused report means nobody drafts, checks or reads it. The other options shift effort to a reader or checker rather than taking it away.",
          },
          {
            question:
              "In the pre-check, what does \"How would I know if it went wrong?\" protect against most?",
            options: [
              "Choosing a tool that costs more than the task is really worth",
              "Speeding up a step in the process that is not the bottleneck",
              "Errors that go unnoticed for weeks and spread into other work",
              "Handing a task to AI that the team would prefer to do by hand",
            ],
            correctIndex: 2,
            explanation:
              "Without a way to spot mistakes, delays and unchecked trust let errors travel. Naming the check up front builds in the balancing loop that catches them.",
          },
          {
            question:
              "Which task most clearly calls for heavy checking, or for not automating at all, based on \"What happens if it's wrong?\"",
            options: [
              "Suggesting three title ideas for an internal team newsletter",
              "Drafting a friendly reminder about the office tea rota",
              "Filling in payment amounts on invoices sent to customers",
              "Rewording a social media post to sound a little warmer",
            ],
            correctIndex: 2,
            explanation:
              "A wrong payment amount affects money and trust and is hard to undo. The others are low-stakes and easy to fix if the output is off.",
          },
          {
            question:
              "Someone says \"AI can reply to our emails, so let's automate the inbox.\" What is the best first question from a systems view?",
            options: [
              "Which AI tool writes the most natural-sounding replies?",
              "Where is work actually waiting in the inbox process now?",
              "How many emails can the tool answer in a single minute?",
              "Could we set it up today and fix any problems as they come?",
            ],
            correctIndex: 1,
            explanation:
              "If writing replies is not where work waits, faster replies will not help much. Finding the bottleneck first tells you whether AI belongs at that step at all.",
          },
        ],
      },
    ],

    quiz: [
      {
        question:
          "A household uses an AI meal planner, but food still gets wasted each week. What does a systems view suggest looking at?",
        options: [
          "Whether a newer meal planner app would make better suggestions",
          "How the plan connects to shopping, fridge checks and who cooks",
          "Whether the family should stop planning meals altogether",
          "How many recipes the meal planner can produce each week",
        ],
        correctIndex: 1,
        explanation:
          "The planner is one part. Waste depends on the connections: whether anyone checks what is already in the fridge, who shops and who actually cooks. A new app changes none of those.",
      },
      {
        question:
          "An office has had three printer jams this week. Someone notices it happens every Monday after the weekly bulk print. Which iceberg level have they reached?",
        options: [
          "Event, because they are describing jams that happened this week",
          "Pattern, because they have spotted it repeats in a regular way",
          "Structure, because they have named the printer as the cause",
          "Mental model, because they are questioning how people think",
        ],
        correctIndex: 1,
        explanation:
          "Seeing that it repeats every Monday is a pattern. The structure would be what causes it, such as the bulk print job's size or settings, and they have not got there yet.",
      },
      {
        question:
          "A team keeps sending AI-drafted proposals with outdated prices. Which change is most likely to stop it happening again?",
        options: [
          "Correcting each proposal by hand before it goes to the client",
          "Reminding the team in a meeting to be more careful with prices",
          "Keeping one current price list and pasting it into every prompt",
          "Switching to a different AI tool that is better with numbers",
        ],
        correctIndex: 2,
        explanation:
          "A single current price list changes the structure that produces the error. Correcting by hand fixes events, reminders rely on memory, and a new tool still has no way to know your prices.",
      },
      {
        question: "What is the key difference between a reinforcing loop and a balancing loop?",
        options: [
          "Reinforcing loops are good for a system and balancing loops are bad",
          "Reinforcing loops amplify a change; balancing loops pull it back",
          "Reinforcing loops involve people and balancing loops involve tools",
          "Reinforcing loops are fast and balancing loops always involve delays",
        ],
        correctIndex: 1,
        explanation:
          "A reinforcing loop snowballs in one direction; a balancing loop pushes back towards a target. Either can be helpful or harmful depending on what is snowballing or being held steady.",
      },
      {
        question:
          "A small shop's good reviews bring more customers, who leave more good reviews. What should the owner keep in mind?",
        options: [
          "This loop will keep growing forever without any further effort",
          "The same loop can run in reverse if bad reviews start to build",
          "Balancing loops will stop it, so there is nothing to watch out for",
          "Reviews are a knock-on effect, so they do not really form a loop",
        ],
        correctIndex: 1,
        explanation:
          "A reinforcing loop amplifies whatever direction it is moving in. If service slips and bad reviews appear, the same loop can drive customers away just as quickly.",
      },
      {
        question:
          "You change a prompt to fix a problem, see no difference in the first few outputs, and change it again twice more. Later the outputs swing too far. What systems idea explains this?",
        options: [
          "A reinforcing loop, because each change makes the tool worse",
          "A bottleneck, because the prompt is the slowest part of the work",
          "A delay, because you acted again before the first change showed",
          "A mental model, because you believed the prompt was the problem",
        ],
        correctIndex: 2,
        explanation:
          "Like the slow shower, you reacted before the effect of the first change was clear, so the combined changes overshot. Giving one change time to show before adding another avoids it.",
      },
      {
        question:
          "Every applicant for a job now uses similar AI tools to write their cover letters. What knock-on effect is most likely?",
        options: [
          "Letters become more varied because AI suggests many different styles",
          "Letters start to sound alike, so specific facts and voice stand out more",
          "Recruiters read every letter more closely because quality has improved",
          "Cover letters become more accurate because AI checks the facts in them",
        ],
        correctIndex: 1,
        explanation:
          "When everyone uses the same tools in similar ways, output converges and readers tune it out. What makes a letter stand out is what the tool could not supply: your real specifics.",
      },
      {
        question:
          "A team uses AI so everyone writes longer meeting notes, then uses AI to summarise them. What has most likely happened?",
        options: [
          "The team is better informed because more detail is now recorded",
          "Work has been added at both ends without anyone learning more",
          "The meetings have become shorter because notes are written faster",
          "Nothing has changed, since the two uses of AI cancel each other out",
        ],
        correctIndex: 1,
        explanation:
          "Cheap writing produced more to read, which was then shrunk again. Effort went into both steps and it is not clear anyone ends up better informed. That is a knock-on effect worth questioning.",
      },
      {
        question:
          "A café's slowest step is the single coffee machine. The owner buys an AI tool that takes orders faster. What is the likely effect on waiting times?",
        options: [
          "They fall, because orders now reach the counter more quickly",
          "Little change, because drinks still queue at the one machine",
          "They fall, because staff can spend more time making drinks",
          "Little change, because customers take longer to use the tool",
        ],
        correctIndex: 1,
        explanation:
          "The coffee machine is the bottleneck. Faster ordering just moves the queue from the till to the machine, so customers wait roughly as long for their drink.",
      },
      {
        question:
          "You use AI to write a detailed weekly update in seconds. Your manager now spends twice as long reading it. How best to describe this?",
        options: [
          "The work was removed, because writing the update is now instant",
          "The work was moved, because more reading lands on your manager",
          "The work was doubled, because the AI had to write it twice over",
          "The work was balanced, because the reading matches the writing",
        ],
        correctIndex: 1,
        explanation:
          "Your effort fell, but your manager's rose. Effort shifted downstream rather than disappearing. That may be acceptable, but it should be a choice, not a surprise.",
      },
      {
        question:
          "Before automating customer replies, a shop owner asks \"What happens if it's wrong?\" Why does this question matter most?",
        options: [
          "It decides how quickly the AI tool will be able to reply",
          "It sets how much checking is needed, or whether to automate",
          "It shows which member of staff should be blamed for errors",
          "It tells you which AI tool to choose for the customer replies",
        ],
        correctIndex: 1,
        explanation:
          "The cost of a mistake decides how much protection the task needs. Low-stakes tasks can run with light checks; high-stakes ones need careful review or should not be handed over.",
      },
      {
        question:
          "A colleague wants to automate a monthly report with AI. Using the pre-check, what should they ask first?",
        options: [
          "What the report is really for, and whether it needs to exist",
          "Which AI tool can produce the longest and most detailed report",
          "How to make the report look more polished for senior readers",
          "Whether the report can go out weekly now that it is quicker",
        ],
        correctIndex: 0,
        explanation:
          "Starting from the real goal can reveal that the report could be shorter, merged or stopped. Automating a report nobody needs just makes unneeded work faster.",
      },
    ],
  },
];

export const TRACK_1_MODULE_8_EXAM: SeedQuestion[] = [
  {
    question: "In the iceberg model, what sits at the deepest level?",
    options: [
      "Events: the things that just happened",
      "Patterns: what keeps happening over time",
      "Structures: the rules, tools and habits",
      "Mental models: the beliefs behind it all",
    ],
    correctIndex: 3,
    explanation:
      "The levels run from events at the tip, through patterns and structures, down to mental models: the beliefs and assumptions that keep the structures in place.",
    difficulty: 1,
    moduleNumber: 8,
  },
  {
    question: "Which situation is the clearest example of a balancing loop?",
    options: [
      "A viral post gets more shares the more people have already shared it",
      "A thermostat turns the heating off once the room reaches its target",
      "An inbox gets further behind as customers send more chasing emails",
      "A popular restaurant gets busier because full tables attract diners",
    ],
    correctIndex: 1,
    explanation:
      "A balancing loop pushes things back towards a target, as the thermostat does. The other three snowball in one direction, which makes them reinforcing loops.",
    difficulty: 1,
    moduleNumber: 8,
  },
  {
    question:
      "A small charity uses AI to write grant applications much faster. Applications now wait a fortnight for the director's sign-off. What is the best next step?",
    options: [
      "Use AI to write applications even faster so more can be sent",
      "Look at how to ease the sign-off step, which is now the bottleneck",
      "Stop using AI, since it has clearly made the process slower overall",
      "Send applications without sign-off so they are not held up any more",
    ],
    correctIndex: 1,
    explanation:
      "Sign-off is now the slowest step, so faster drafting only lengthens the queue. Improving the bottleneck, for example with a clear checklist or a scheduled review slot, speeds up the whole process.",
    difficulty: 2,
    moduleNumber: 8,
  },
  {
    question:
      "A team shares one AI-written summary of a policy, and several people copy parts of it into their own documents. Nobody checked the summary. What is the main risk?",
    options: [
      "The summary will be too short to be useful to most of the team",
      "Any error in it spreads into every document built on top of it",
      "The team will stop reading policies because summaries are quicker",
      "The AI tool will learn the wrong policy from the copied documents",
    ],
    correctIndex: 1,
    explanation:
      "Unchecked output that others build on lets a single error compound. One check at the start is a balancing loop that stops the mistake travelling into every copy.",
    difficulty: 2,
    moduleNumber: 8,
  },
  {
    question:
      "A clinic receptionist has corrected AI appointment reminders with the wrong opening hours four times this month. Each time they fixed the message and sent it. What does this reveal?",
    options: [
      "The receptionist is working well, since every error was caught in time",
      "They are fixing events while the cause, such as missing hours, remains",
      "The AI tool is faulty and should be replaced with a more accurate one",
      "Reminders are low-risk, so the errors are not worth further attention",
    ],
    correctIndex: 1,
    explanation:
      "Four repeats is a pattern. The likely structure is that the correct hours are not given to the tool, so it guesses. Supplying the hours every time would stop the pattern rather than patch each event.",
    difficulty: 3,
    moduleNumber: 8,
  },
  {
    question:
      "A manager proposes letting AI send all replies to supplier invoices without review, because drafting replies is \"the slow part\". Checking shows most delay is waiting for finance approval. What is the strongest systems argument against the plan?",
    options: [
      "AI replies would sound less friendly than the ones staff write now",
      "It speeds up a step that is not slow and removes a check on money",
      "Suppliers may not like receiving replies that were drafted by AI",
      "The team would need to learn a new tool before it saves any time",
    ],
    correctIndex: 1,
    explanation:
      "The bottleneck is finance approval, so faster drafting will not speed things up. Meanwhile removing review on money-related replies raises the cost of any error, which fails the pre-check twice.",
    difficulty: 3,
    moduleNumber: 8,
  },
];
