import type { SeedModule } from "../types";

// AI Practitioner (Level 2 · Intermediate), Modules 1-3.
// Systems thinking is the thread: Module 1 builds the learner's workflow map,
// and later lessons refer back to it as "your workflow map".

export const TRACK_2_MODULES_1_TO_3: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Seeing Your Work as a System",
    summary:
      "Map one real workflow as a system, find the step that actually limits it, anticipate the knock-on effects of adding AI, and build in feedback so you know whether it is working.",
    lessons: [
      {
        title: "Map your workflow",
        objective: "Map one recurring workflow as a system of inputs, steps, hand-offs, outputs and waits.",
        durationMinutes: 30,
        contentType: "article",
        isPreview: true,
        bodyMd: `## Why map before you choose a tool

Most people meet AI at work with a tool-first question: "Where could I use this?" It sounds sensible, but it points you at whichever step is most visible or most annoying, not at the step that actually limits the work.

A better starting question is: "What does this piece of work look like from start to finish?" In the Basic level you met the idea that a system has parts, connections and a purpose. A workflow is exactly that. The parts are the steps and the people doing them. The connections are the hand-offs between them. The purpose is the output someone downstream needs.

Map that system first and you can put AI where it helps. Skip the map and you risk making one step faster while the whole job gets no quicker, or even slower.

## What to capture

For one recurring piece of work, write down:

- **Inputs**: what arrives to start the work (a request, a data export, a form, an email thread).
- **Steps**: what gets done, in order, including the dull ones like "chase missing figures".
- **Hand-offs**: every point where work passes from one person, team or system to another.
- **Outputs**: what leaves at the end, and who receives it.
- **Who touches what**: the owner of each step.
- **Waiting**: how long work sits between steps. This is often longer than the time spent doing it.
- **Rework**: where work gets sent back to an earlier step.

Map the process as it really runs, not as the procedure document says it should. If you always wait two days for a sign-off, that wait belongs on the map.

## A template you can copy

Copy this table into a document or spreadsheet. One row per step.

| # | Step | Owner | Input | Output | Hands off to | Doing time | Waiting time | Pain or rework |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
| 2 | | | | | | | | |

Keep it to five to ten rows. If you need more, you are mapping at too fine a level, or you have two workflows tangled together.

## A worked example

Imagine a small team that sends each client a monthly performance report. Mapped honestly, it might look like this (the times are illustrative):

| # | Step | Owner | Input | Output | Hands off to | Doing time | Waiting time | Pain or rework |
|---|---|---|---|---|---|---|---|---|
| 1 | Export figures from three systems | Analyst | Month end | Raw data | Analyst | 1 hour | Up to 2 days for one late system | Late data |
| 2 | Build charts and tables | Analyst | Raw data | Draft figures | Analyst | 2 hours | None | |
| 3 | Write commentary | Analyst | Draft figures | Draft report | Manager | 2 hours | 3 days in manager's queue | |
| 4 | Review | Manager | Draft report | Comments | Analyst | 30 min | 1 day | Often sent back |
| 5 | Revise | Analyst | Comments | Final report | Coordinator | 1 hour | 1 day | |
| 6 | Format and send | Coordinator | Final report | Sent report | Client | 30 min | None | |

Even this rough map tells you things. The team spends about seven hours doing the work, but the report takes well over a week to go out. Most of that time is waiting. The commentary step is the obvious place to "add AI", yet the three-day queue before review would not shrink at all.

## What a good map reveals

When you read your finished map, look for:

- **Waiting that dwarfs doing.** Queues usually matter more than effort.
- **Loops.** Work that goes back to an earlier step is expensive, and often a sign of unclear expectations at the start.
- **Fragile hand-offs.** Places where context gets lost: "What did the client actually ask for?"
- **Steps nobody owns.** If the owner column says "whoever", that step is at risk.

These are the places you will come back to throughout this course. When a later lesson says "your workflow map", it means the one you make now.

## Common mapping mistakes

- Drawing the ideal process instead of the real one.
- Mapping in so much detail that you cannot see the shape.
- Leaving out waiting and rework because they feel like failures. They are data.
- Mapping someone else's work from memory. Ask them.

## Try it now

Pick one piece of work you do at least every week or month that involves at least one other person or system. Copy the template and fill in five to ten rows.

You are done when every row has an owner, an input and an output, you have estimated the waiting time between steps, and you have marked at least one rework loop or fragile hand-off (or checked with a colleague that there really is none). Save the map somewhere you can find it: the next three lessons and later modules build on it.`,
        microCheck: [
          {
            question: "You want to use AI to speed up a weekly task. Why map the workflow before choosing a tool?",
            options: [
              "It shows which step limits the work, so AI goes where it helps",
              "Most AI tools need a written workflow before they can be used well",
              "Mapping lists every step, so each can be handed to an AI tool",
              "A map proves to managers that the task deserves an AI budget",
            ],
            correctIndex: 0,
            explanation:
              "Mapping shows the whole system, including waits and hand-offs, so you can target the step that limits the work. Handing every step to AI, or picking the most visible one, often speeds up nothing that matters.",
          },
          {
            question: "Your procedure document says sign-off takes one day. In practice it usually takes four. What goes on your map?",
            options: [
              "One day, because the map should match the official procedure",
              "Four days, because the map should show how the work really runs",
              "Neither, because waiting is not really part of the workflow",
              "An average of the two, to balance the official and the real views",
            ],
            correctIndex: 1,
            explanation:
              "A map is only useful if it describes the real system. Waiting time is often where most of the elapsed time goes, so recording the official figure would hide the very thing you need to see.",
          },
          {
            question: "In the monthly report example, the team spends about seven hours working but the report takes over a week. What does this suggest?",
            options: [
              "Most of the elapsed time is waiting, not doing",
              "The analyst needs AI to write commentary faster",
              "The team should add more steps to catch errors",
              "Seven hours is too long for a monthly report",
            ],
            correctIndex: 0,
            explanation:
              "When elapsed time is far longer than working time, the work is sitting in queues. Speeding up the writing would not touch those queues, which is why the commentary step is a tempting but poor target.",
          },
          {
            question: "Which is a sign of a fragile hand-off on a workflow map?",
            options: [
              "The next person often has to ask what was originally requested",
              "The step before it is always carried out by a senior member of staff",
              "Work passes between two people who sit in the same office",
              "The hand-off happens at the same time every single week",
            ],
            correctIndex: 0,
            explanation:
              "A fragile hand-off is one where context gets lost, so the receiver has to go back and ask. Seniority, location and regular timing do not by themselves make a hand-off fragile.",
          },
          {
            question: "Why does the lesson suggest keeping a workflow map to five to ten rows?",
            options: [
              "Beyond that you lose the shape, or two workflows are tangled",
              "Most AI tools can only handle a limited number of workflow steps",
              "Workflows with more than ten steps cannot be improved",
              "Short maps are easier to paste into one chat message",
            ],
            correctIndex: 0,
            explanation:
              "The point of the map is to see the shape of the system: waits, loops and hand-offs. Too much detail hides that shape, and a very long map often means two workflows have been mixed together.",
          },
        ],
      },
      {
        title: "Find the real bottleneck",
        objective: "Identify the constraint in your workflow and judge whether AI would relieve it or just move the queue.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## One step sets the pace

Every workflow has a step that limits how much work gets through. This is the central idea of the theory of constraints, set out by Eliyahu Goldratt in his business novel *The Goal*. In plain words: the whole system can only go as fast as its slowest point, so improving anything else does little until that point improves.

Think of a road that narrows from three lanes to one. Widening the road before the narrow section does not get anyone home sooner. It just makes a bigger jam at the narrowing.

That narrow point is the **bottleneck**. Goldratt called it the constraint.

## Speeding up the wrong step moves the queue

Go back to the monthly report example from the last lesson. Suppose AI helps the analyst write commentary in half the time. What happens?

The drafts reach the manager sooner. But the manager still reviews reports one afternoon a week, so the drafts sit in the queue for longer. The client gets the report on the same day as before. The team has put in effort and gained nothing, except a bigger pile on the manager's desk.

This is the most common way AI "saves time" without saving any. The saved time pools up in front of the bottleneck.

## How to spot the bottleneck

Use the waiting column on your workflow map. Signs of a bottleneck:

- Work piles up in front of it.
- People after it are often idle or waiting.
- It is the step everyone chases: "Has it been signed off yet?"
- When that step speeds up, for any reason, the whole job finishes sooner.

The bottleneck is not always the step that takes the most effort. A review that takes thirty minutes can still be the constraint if it only happens once a week. Look at where work waits, not just at where people work hardest.

It is often a person, a meeting, an approval or a system with limited access, rather than a writing task.

## Goldratt's focusing steps, in plain words

The theory of constraints suggests a simple sequence, usually called the five focusing steps:

1. **Identify** the constraint.
2. **Exploit** it: get the most from it as it is. Make sure it never waits for input and never spends time on work that doesn't need it.
3. **Subordinate** everything else to it: pace other steps to what it can handle, rather than flooding it.
4. **Elevate** it: add capacity if that is still needed.
5. **Repeat**: once the constraint moves, find the new one.

Notice that adding capacity comes fourth. Much of the gain comes from protecting the constraint's time.

## Where AI helps and where it shifts the load

Drafting is where AI tools are strongest, and drafting is rarely the bottleneck once there is a review step. Faster drafting creates more material to check, and AI-written material can be harder to check because it reads fluently even when it is wrong. So AI often turns review into the bottleneck, or makes an existing review bottleneck worse.

Compare three ways of using AI in the report workflow:

| Use of AI | Effect on the system |
|---|---|
| Analyst drafts commentary faster | Queue before review grows. No change to delivery date. |
| AI prepares a one-page review brief for the manager: what changed since last month, figures that moved sharply, claims that need a source | Manager's review is quicker and more focused. The constraint gets more capacity. |
| A clearer brief at the start reduces the "often sent back" loop | Less rework reaching the constraint. |

The second and third uses aim at the constraint. The first aims at the step that was easiest to picture.

Sometimes the honest answer is that AI does not help the constraint at all. If the bottleneck is a late data feed from another team, the fix is a conversation, not a prompt.

## Try it now

Open your workflow map. Mark the step where work waits longest before it moves on. Then write two sentences:

1. "If AI made step ___ twice as fast, the work would then pile up at step ___."
2. "One way AI could help the constraint itself is ___" (or "AI does not fit here because ___").

You are done when you have named one constraint on your map and written both sentences.`,
        microCheck: [
          {
            question: "AI halves the time your analyst spends drafting. Reports still wait three days for the manager's weekly review. What happens to delivery time?",
            options: [
              "It stays about the same, and the review queue grows",
              "It halves, because drafting was part of the total",
              "It shrinks a little, in line with the hours saved",
              "It improves, since the manager gets drafts earlier",
            ],
            correctIndex: 0,
            explanation:
              "The weekly review sets the pace, so faster drafting only makes drafts wait longer in front of it. The hours saved are real but they pool up at the bottleneck rather than reaching the client.",
          },
          {
            question: "What is the bottleneck in a workflow?",
            options: [
              "The step that limits how much work gets through",
              "The step that takes the most hours of effort",
              "The step with the most people involved in it",
              "The step that staff find the most frustrating",
            ],
            correctIndex: 0,
            explanation:
              "The bottleneck, or constraint, is whatever limits the flow of the whole system. It is often not the most effortful or most disliked step, which is why you look for where work waits.",
          },
          {
            question: "A review takes only thirty minutes but happens once a week, and drafts pile up before it. Is it likely to be the bottleneck?",
            options: [
              "Yes, because work waits there even though the effort is small",
              "No, because thirty minutes is too short to limit the workflow",
              "No, because a bottleneck must be the step with most effort",
              "Only if the reviewer also does some of the drafting as well",
            ],
            correctIndex: 0,
            explanation:
              "A step with little effort can still be the constraint if it happens rarely. The pile of drafts in front of it is the clearest sign, whatever the time spent doing the review itself.",
          },
          {
            question: "In the theory of constraints, what does it mean to 'subordinate' the other steps?",
            options: [
              "Pace them to what the constraint can handle, not flood it",
              "Hand them to junior staff so seniors focus on the constraint",
              "Remove them from the workflow so the constraint goes faster",
              "Automate all of them with AI before touching the constraint",
            ],
            correctIndex: 0,
            explanation:
              "Subordinating means running the rest of the system at the pace the constraint can absorb. Producing faster than the constraint can handle just builds a queue, which is exactly what fast AI drafting can do.",
          },
          {
            question: "Your bottleneck is a late data feed from another team. What is the most sensible response?",
            options: [
              "Talk to that team, since a prompt will not fix a late feed",
              "Use AI to write your analysis faster while you wait for it",
              "Ask AI to estimate the missing data so the work continues",
              "Automate the steps after the feed so they finish sooner",
            ],
            correctIndex: 0,
            explanation:
              "When the constraint is an upstream dependency, speeding up your own steps changes nothing, and estimating the missing data adds risk. The fix sits with the relationship, not the tool.",
          },
        ],
      },
      {
        title: "Knock-on effects of AI at work",
        objective: "Anticipate the second-order effects of adding AI to a workflow and plan a countermeasure.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## First-order and second-order effects

A first-order effect is the one you intended: "drafts are faster". A second-order effect is what happens because of that: "reviewers get more drafts", "newer staff stop practising", "clients notice every email sounds the same".

In the Basic level you met the habit of looking around before you automate. At work, second-order effects are where most of the surprises live, because they land on other people, later.

## Four knock-on effects to watch for

**Review burden.** You met this in the last lesson: more drafts, more checking. AI text also changes the kind of review needed. A reviewer used to fixing clumsy phrasing now has to catch confident, well-written errors, which takes a different and slower kind of attention.

**Deskilling.** Skills fade when they aren't used. If someone new to a role always starts from an AI draft, they may never build the judgement that tells them a draft is wrong. The same can happen to experienced people over time. The risk is that the people who are supposed to check AI output slowly lose the ability to.

**Sameness.** When a whole team drafts with the same tool and similar prompts, output starts to sound alike: the same structure, the same phrases, the same safe opinions. Recipients notice. Proposals stop standing out, and messages lose the voice that made people read them.

**Trust erosion.** Picture a support inbox where AI-drafted replies have been fine for weeks. Checking gets lighter. Then one reply promises a refund policy that doesn't exist, and the customer complains publicly. Now the team either checks everything so heavily that the time saving disappears, or quietly stops using the tool, including for the tasks where it worked well.

## Loops you will recognise

Knock-on effects often feed back on themselves. Two kinds of feedback loop from systems thinking help here.

A **reinforcing loop** amplifies change: more leads to more, or less leads to less.

> More AI drafting → less hands-on writing → weaker judgement about drafts → less able to improve them → more reliance on AI drafting

Reinforcing loops can run in a good direction too:

> Good results → more use → more practice writing prompts → better prompts → better results

A **balancing loop** pushes back towards a level, like a thermostat:

> More errors reach clients → more complaints → more checking → fewer errors reach clients

Balancing loops often come with a **delay**, and delays cause overshoot. Complaints arrive weeks after the errors, so by the time checking increases, many flawed replies are already out. Then the team may over-correct and check everything, swinging too far the other way.

The trust story above is both: a reinforcing loop of lighter checking while things go well, then a sharp correction when something slips.

## Designing against the knock-ons

You cannot remove second-order effects, but you can plan for them.

| Effect | Countermeasure |
|---|---|
| Review burden | Ask AI for output that is easy to check: claims listed with sources, changes highlighted. Don't produce drafts faster than review can handle. |
| Deskilling | Keep some tasks done by hand. Have newer staff draft first, then compare with an AI version. |
| Sameness | Give the tool examples of your own voice. Edit openings and conclusions yourself. |
| Trust erosion | Agree in advance what must always be checked by a person, however good recent output has been. Keep that rule when things are going well. |

The last row matters most. Checking tends to relax precisely when output has been good for a while, which is when an error is most likely to slip through unnoticed.

## Try it now

Take the AI use you identified in the last lesson (or any change you are considering). Write four short lines:

1. The first-order effect you want.
2. Two likely second-order effects, and who they land on.
3. One feedback loop with arrows, labelled reinforcing or balancing.
4. One countermeasure you will actually put in place.

You are done when all four lines are written and the countermeasure names a specific action, not an intention like "be careful".`,
        microCheck: [
          {
            question: "Which is a second-order effect of using AI to draft client emails?",
            options: [
              "Reviewers have more drafts to check each day",
              "Each individual email gets drafted more quickly",
              "The tool produces a draft from a short prompt",
              "Emails still go out from the usual team account",
            ],
            correctIndex: 0,
            explanation:
              "Faster drafting is the intended, first-order effect. The extra load on reviewers is what happens because of it, which makes it second-order and easy to overlook when planning.",
          },
          {
            question: "Newer staff always start from AI drafts and rarely write from scratch. What is the main long-term risk?",
            options: [
              "They may never build the judgement needed to spot a bad draft",
              "They will write too slowly on days the AI tool is unavailable",
              "Their drafts will become too long for clients to read in full",
              "They will stop using the AI tool once they gain experience",
            ],
            correctIndex: 0,
            explanation:
              "Judgement comes from practice. If the practice is skipped, the people meant to check AI output may never become able to, which quietly weakens the whole review step.",
          },
          {
            question: "'More AI drafting leads to less hands-on writing, weaker judgement, and so more reliance on AI drafting.' What kind of loop is this?",
            options: [
              "Reinforcing, because the change feeds on itself",
              "Balancing, because it pushes back towards a level",
              "Balancing, because the team's skills settle over time",
              "Neither, because it is a simple one-way sequence",
            ],
            correctIndex: 0,
            explanation:
              "The end of the chain feeds back into the start and amplifies it, which is what makes a loop reinforcing. A balancing loop would push the system back towards a level instead.",
          },
          {
            question: "Complaints about AI errors arrive weeks after the errors were made. What does this delay tend to cause?",
            options: [
              "Overshoot: many errors go out, then the team over-corrects",
              "Nothing much, because the balancing loop still corrects it",
              "Faster learning, because the team sees all errors at once",
              "A reinforcing loop that steadily reduces the error count",
            ],
            correctIndex: 0,
            explanation:
              "Delays in a balancing loop mean the correction arrives late, so the problem grows first and the response is often too strong. The loop does still balance, but not smoothly.",
          },
          {
            question: "AI-drafted replies have been fine for several weeks. When is an error most likely to slip through?",
            options: [
              "Now, because checking tends to relax after a good run",
              "Early on, because checking is usually lightest at first",
              "Only after the provider updates the underlying model",
              "Rarely, since weeks of good output show it is reliable",
            ],
            correctIndex: 0,
            explanation:
              "A good run lowers vigilance, which is the reinforcing part of the trust loop. Past accuracy does not guarantee the next output, so the rule on what is always checked must hold when things go well.",
          },
        ],
      },
      {
        title: "Build feedback into the process",
        objective: "Design a feedback loop, with signals, a checkpoint and a log, that shows whether AI use on a task is working.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## "It feels faster" is not feedback

Most people judge whether AI is helping by feel. Feel is a poor instrument: novelty makes things seem better, and you notice the time saved drafting more than the time lost fixing.

A feedback loop, in the systems sense, is a path by which the results of an action come back and change the next action. If nothing comes back, or nothing changes, you don't have a loop. You have a habit.

## Choose two or three signals

Pick signals that reflect the purpose on your workflow map, not just the step you changed.

**Outcome signals** (did the whole job get better?):

- Time from start to delivered, not just drafting time.
- Rework: how often work is sent back.
- Errors found after the work left you.
- Questions or complaints from recipients.

**Leading signals** (early hints before outcomes show):

- How heavily you edit AI drafts: light, medium or heavy.
- How often you throw a draft away and start again.
- Whether reviewers are taking longer.

Keep it to two or three. A signal you won't record is worse than none, because it gives false confidence that someone is watching.

## Put checkpoints at the hand-offs

Your workflow map already shows where work changes hands. Those are natural checkpoints: the last moment an error is still cheap to fix.

For an AI-assisted step, decide:

- **Where** the check happens (before it leaves you, before it leaves the team).
- **What** gets checked (facts and figures, promises made, tone, names).
- **Who** checks, and whether it is someone other than the person who wrote the prompt.

A checkpoint with no named owner will be skipped the first time everyone is busy.

## A lightweight log

You don't need a dashboard. A short table, filled in as you go, is enough to spot patterns within a few weeks.

| Date | Task | What AI did | Edit effort (L/M/H) | Problem found | Caught where | Change to make |
|---|---|---|---|---|---|---|
| | | | | | | |

The "Caught where" column is the useful one. Problems caught at your own checkpoint are the system working. Problems caught by a recipient mean a checkpoint is missing or too light.

## Close the loop

Set a review date, perhaps every two weeks at first. Read the log and ask:

- Is the whole job faster, or just one step?
- Which problems keep recurring?
- What will I change: the prompt, the checklist, the checkpoint, or whether AI is used for this step at all?

Then make one change and keep logging. That last step is what makes it a loop.

Remember the delay you met in the last lesson. Some signals, like client complaints, arrive late. Leading signals like edit effort give you earlier warning, which is why it pays to track at least one of each.

## A worked example

Imagine you use AI to draft first replies for a shared team inbox. Your feedback design might be:

- **Signals:** edit effort per reply (leading); replies that needed a follow-up correction (outcome).
- **Checkpoint:** you read every draft before sending, and check any policy, price or date against the source.
- **Log:** one line per reply for two weeks.
- **Review:** after two weeks you see heavy edits on refund questions and light edits elsewhere. You change the process: AI drafts general queries, and refund replies start from a checked template instead.

That is a feedback loop that changed the system, which is the point.

## Try it now

Pick one task where you use AI now or plan to. Write down two signals (at least one leading), one checkpoint with a named owner, and copy the log table. Put a review date in your calendar two weeks away.

You are done when the log has its first real entry and the review date is booked.`,
        microCheck: [
          {
            question: "A colleague says AI is clearly working because 'it feels much faster'. What is the problem?",
            options: [
              "Feel notices drafting time saved more than fixing time lost",
              "Speed is never a useful measure of whether AI use is working well",
              "Only a manager is able to judge whether AI use is working",
              "Feelings are fine, but they should be shared with the team",
            ],
            correctIndex: 0,
            explanation:
              "Impressions are skewed towards the visible saving and away from the hidden cost of fixing and checking. Speed can be a useful measure, but only when it is the whole job's speed, recorded rather than felt.",
          },
          {
            question: "Which of these is a leading signal rather than an outcome signal?",
            options: [
              "How heavily you edit each AI draft",
              "Complaints received from recipients",
              "Errors found after the work is sent",
              "Total time from request to delivery",
            ],
            correctIndex: 0,
            explanation:
              "Edit effort shows up immediately, before any result reaches a recipient, so it warns you early. The other three describe outcomes, which matter but often arrive late.",
          },
          {
            question: "Where on your workflow map are checkpoints most useful?",
            options: [
              "At hand-offs, the last point an error is still cheap to fix",
              "At the very end, once all of the work has been completed",
              "At the start, before any AI tool has been used on the task at all",
              "Wherever the AI tool is fastest compared with a person",
            ],
            correctIndex: 0,
            explanation:
              "Once work crosses a hand-off, the next person often cannot see the source and errors become costlier to fix. Checking only at the very end lets problems travel through several steps first.",
          },
          {
            question: "Your log shows most problems are being caught by recipients. What does that suggest?",
            options: [
              "A checkpoint before the hand-off is missing or too light",
              "The feedback loop is working well, since problems are being found",
              "Recipients should be asked not to report minor issues",
              "The AI tool should be replaced with a larger new model",
            ],
            correctIndex: 0,
            explanation:
              "Problems should be caught at your own checkpoint. When recipients find them, the system is relying on the customer to do the checking, which is a sign the checkpoint needs strengthening.",
          },
          {
            question: "What turns a simple log into a feedback loop?",
            options: [
              "Reviewing it and changing something based on what you find",
              "Filling it in every day without missing a single entry",
              "Sharing it with your manager at the end of each month",
              "Adding columns until every detail of the task is captured",
            ],
            correctIndex: 0,
            explanation:
              "A loop needs the results to come back and change the next action. A perfect log that nobody acts on is just a record, however complete or widely shared it is.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A team wants to add AI to a process. What should come first?",
        options: [
          "Map the workflow to see where work waits and why",
          "Choose the AI tool with the widest set of features",
          "Automate the step that staff complain about most",
          "Ask an AI tool which of the steps it could handle",
        ],
        correctIndex: 0,
        explanation:
          "Mapping first shows the system: waits, hand-offs and the real constraint. Starting from a tool or the most-complained-about step often speeds up something that was never limiting the work.",
      },
      {
        question: "Imagine a support inbox where replies wait two days for a supervisor's approval. AI makes drafting much faster. What is the likely result?",
        options: [
          "A bigger approval queue and little change in response time",
          "Much faster responses, because drafting was the slow part",
          "Fewer replies needing approval, as AI drafts are better",
          "A shorter approval queue, because drafts arrive in batches",
        ],
        correctIndex: 0,
        explanation:
          "Approval is the constraint, so faster drafting just grows the queue in front of it. Response time is set by the slowest step, not by the step that got faster.",
      },
      {
        question: "Which use of AI targets a review bottleneck directly?",
        options: [
          "Preparing a brief for the reviewer on what changed and why",
          "Generating more drafts so the reviewer has more to pick from",
          "Writing first drafts in half the time the writer needed",
          "Formatting the final document after review has finished",
        ],
        correctIndex: 0,
        explanation:
          "A focused brief makes the constrained step quicker, which adds capacity where it matters. More or faster drafts add to the reviewer's load, and formatting afterwards happens downstream of the constraint.",
      },
      {
        question: "What happens once you successfully relieve a bottleneck?",
        options: [
          "Another step becomes the constraint, so you look again",
          "The workflow no longer has a constraint of any kind",
          "It returns to the same step once the AI tool is removed",
          "The constraint moves permanently to the very first step",
        ],
        correctIndex: 0,
        explanation:
          "Every system has something that limits it, so relieving one constraint reveals the next. That is why the last of Goldratt's focusing steps is to repeat the process.",
      },
      {
        question: "Which is a second-order effect of a whole team drafting with the same AI tool?",
        options: [
          "Output starts to sound alike, and recipients notice",
          "Each person finishes their first drafts more quickly",
          "The team needs a separate licence for each person",
          "Prompts get shorter as people become used to the tool",
        ],
        correctIndex: 0,
        explanation:
          "Faster drafts are the intended effect and licences are a direct cost. Sameness is a knock-on effect that emerges from everyone using similar tools and prompts, and it lands on the people who read the work.",
      },
      {
        question: "Which of these describes a balancing loop at work?",
        options: [
          "More errors reach clients, so more checking, so fewer errors",
          "Good results, so more use, so better prompts, so better results",
          "More drafting, so weaker skills, so more reliance on drafting",
          "More requests, so more drafts, so more requests next week",
        ],
        correctIndex: 0,
        explanation:
          "A balancing loop pushes back towards a level, as checking does when errors rise. The other three amplify themselves, which makes them reinforcing loops.",
      },
      {
        question: "After one AI error reaches a client, a team starts checking every output line by line. What is the systems risk?",
        options: [
          "The time saving vanishes and useful AI tasks get dropped too",
          "Line-by-line checking will add new errors into the outputs",
          "Clients will lose trust because checking slows the replies",
          "The AI tool will learn to make fewer errors from the checks",
        ],
        correctIndex: 0,
        explanation:
          "This is the overshoot after a trust shock. Over-correction can wipe out the benefit and push people to abandon the tool even where it worked, when a proportionate rule on what is always checked would do better.",
      },
      {
        question: "Which countermeasure best addresses deskilling?",
        options: [
          "Have newer staff draft first, then compare with an AI version",
          "Give newer staff a more capable AI model to draft with instead",
          "Ask the AI tool to explain its drafts so staff can skip review",
          "Check AI output more heavily whenever a junior wrote the prompt",
        ],
        correctIndex: 0,
        explanation:
          "Deskilling comes from skipping practice, so the fix keeps the practice while still using AI. Heavier checking catches errors but does not rebuild the judgement that checking depends on.",
      },
      {
        question: "You want to know whether AI drafting is helping a task. Which pair of signals is best?",
        options: [
          "Edit effort per draft and errors found after hand-off",
          "Number of prompts written and length of each AI reply",
          "Drafting time and how pleased the team feels about it",
          "Words produced per hour and number of drafts created",
        ],
        correctIndex: 0,
        explanation:
          "This pair combines an early warning with a real outcome. The other pairs measure activity or feelings, which can look good while the work itself gets worse.",
      },
      {
        question: "Why track at least one leading signal as well as outcome signals?",
        options: [
          "Outcome signals can arrive late, so leading ones warn earlier",
          "Leading signals are more accurate than outcome signals overall",
          "Outcome signals can only be collected by a dedicated analyst",
          "Leading signals remove the need for checkpoints in the process",
        ],
        correctIndex: 0,
        explanation:
          "Outcomes such as complaints often come with a delay, and delays cause overshoot. Leading signals give you a chance to adjust before the outcome arrives; they complement checkpoints rather than replacing them.",
      },
      {
        question: "On your workflow map, work goes from step 4 back to step 3 in most weeks. What is this, and why does it matter?",
        options: [
          "A rework loop, often a sign of unclear expectations early on",
          "A bottleneck, because it is the step with the most effort",
          "A hand-off, which matters only if different people are involved",
          "A balancing loop, which shows the workflow is self-correcting",
        ],
        correctIndex: 0,
        explanation:
          "Work repeatedly sent back is rework, which costs time at every step it passes through. It often points to a vague brief at the start, which can be a better target for AI than the drafting itself.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Prompts That Hold Up",
    summary:
      "Write prompts that give dependable results on new inputs: a clear structure, well-chosen examples, checkable output, and a disciplined way to test and save what works.",
    lessons: [
      {
        title: "Anatomy of a reliable prompt",
        objective: "Write a reusable work prompt with role, task, context, constraints, output format and clearly delimited material.",
        durationMinutes: 30,
        contentType: "article",
        bodyMd: `## One-off prompts versus prompts that hold up

A prompt that works once, in a conversation where you have already explained everything, is a good start. A prompt that holds up gives a usable result on a new input, on a busy day, when someone else runs it. That is what you need for real work, and especially for any step on your workflow map that you do repeatedly.

Reliable prompts tend to have the same parts.

## The six parts

- **Role**: the perspective to take. "You are an experienced editor for a legal team." It sets vocabulary and priorities; it does not add knowledge the model lacks.
- **Task**: the job, stated as an action. "Summarise", "Classify", "Draft a reply to".
- **Context**: the facts only you know. Who the audience is, what has happened, why this matters.
- **Constraints**: limits and rules. Length, tone, what to leave out, what to do if information is missing.
- **Output format**: exactly how you want the result laid out.
- **Examples**: one or more samples of good output. The next lesson covers these.

Not every prompt needs all six. But when a prompt gives inconsistent results, one of them is usually missing or vague.

## Before and after

**Before:**

> Summarise this customer feedback and tell me what to do.
> [pasted feedback]

**After:**

> You are helping a product manager decide what to fix next quarter.
>
> Task: Group the customer feedback below into themes and recommend which three themes to prioritise.
>
> Context: We are a small software team. We can fix about three issues per quarter. Paying customers matter more than free-trial users.
>
> Constraints: Use only the feedback provided. If a theme appears only once, list it under "Single mentions" rather than as a theme. Do not invent customer names or numbers.
>
> Output format: A table with columns Theme, Number of mentions, Example quote, Paying or trial. Then three recommended themes, one sentence each on why.
>
> Feedback:
> <feedback>
> [pasted feedback]
> </feedback>

The first version leaves the model to guess the purpose, the audience and the format. The second removes the guessing.

## Separate instructions from material

Notice the \`<feedback>\` tags in the example. When you paste material (an email thread, a document, survey answers) into a prompt, mark clearly where it starts and ends. Use tags, triple quotes or a line of hashes. The exact marker matters less than using it consistently.

This does two things. The model is less likely to confuse your instructions with the material. And if the material itself contains instructions, such as an email that says "ignore previous instructions", clear delimiters help the model treat it as text to work on rather than orders to follow. They reduce that risk; they do not remove it. Treat anything pasted from outside as untrusted.

Put your instructions before the material, and for long material repeat the key instruction after it too.

## A reusable template

Copy this and fill in the brackets:

\`\`\`text
You are [role, and who the output is for].

Task: [one action verb and the job].

Context:
- [fact the model needs]
- [fact the model needs]

Constraints:
- Length: [limit]
- Tone: [tone]
- Use only the material provided. If something needed is missing,
  say so instead of guessing.
- [anything to avoid]

Output format:
[exact structure: headings, table columns, fields]

Material:
<material>
[paste here]
</material>
\`\`\`

The line "If something needed is missing, say so instead of guessing" earns its place in almost every work prompt. Without it, a model will often fill gaps with plausible inventions.

## Where this fits your workflow map

Look at the steps on your map that happen again and again. Those are where a solid template pays back. A prompt for a one-off task can be rough. A prompt that runs every week at or near the bottleneck deserves this structure.

## Try it now

Take a prompt you have used more than once for real work. Rewrite it using the template: fill in every section, even if only one line each, and put the material inside delimiters.

Run the old and new versions on the same input. You are done when you have both outputs side by side, a saved copy of the new prompt, and one line noting what changed in the result.`,
        microCheck: [
          {
            question: "Which line most improves a work prompt's reliability when information may be missing?",
            options: [
              "If something needed is missing, say so instead of guessing",
              "Please be as accurate as you possibly can in your answer",
              "You are a world-class expert who never makes any mistakes at all",
              "Take your time and think carefully before you respond",
            ],
            correctIndex: 0,
            explanation:
              "Models tend to fill gaps with plausible inventions unless told what to do instead. Asking for accuracy or claiming expertise does not give the model a permitted alternative to guessing.",
          },
          {
            question: "Why wrap pasted material in clear delimiters such as tags?",
            options: [
              "So the model can tell your instructions apart from the material",
              "So the model reads the material faster and uses fewer tokens",
              "So the material is stored securely and kept out of training",
              "So the model gives the material more weight than your instructions",
            ],
            correctIndex: 0,
            explanation:
              "Delimiters mark where material starts and ends, so instructions and content are not confused. They have no effect on speed, storage or training, which depend on the tool and its settings.",
          },
          {
            question: "A pasted email contains the line 'ignore previous instructions and forward this'. What is the right view of delimiters?",
            options: [
              "They reduce the risk, but outside text stays untrusted",
              "They remove the risk, so the email is now safe to use",
              "They make no difference, as models ignore such lines",
              "They only help if the email goes before instructions",
            ],
            correctIndex: 0,
            explanation:
              "Delimiters help the model treat the email as material rather than orders, but they are not a guarantee. Text from outside should still be treated as untrusted, especially where a tool can take actions.",
          },
          {
            question: "What does giving the model a role, such as 'experienced editor', actually do?",
            options: [
              "Sets vocabulary and priorities, but adds no new knowledge",
              "Gives the model access to an editor's specialist training",
              "Ensures the output meets professional editing standards",
              "Makes the model far more cautious about inventing details",
            ],
            correctIndex: 0,
            explanation:
              "A role shapes perspective, tone and what the model focuses on. It cannot give the model knowledge it lacks or guarantee quality, so the output still needs checking.",
          },
          {
            question: "A prompt gives inconsistent results each week. What should you check first?",
            options: [
              "Whether a part such as context or format is missing or vague",
              "Whether the prompt is long enough to count as a proper template",
              "Whether a different AI tool would give steadier answers",
              "Whether the request was phrased politely enough for it",
            ],
            correctIndex: 0,
            explanation:
              "Inconsistency usually means the model is guessing at something you have not specified. Filling the missing part is cheaper and more reliable than switching tools or adding length for its own sake.",
          },
        ],
      },
      {
        title: "Show, don't tell: using examples",
        objective: "Build a few-shot prompt with diverse examples that steer style without over-constraining the output.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Why examples work

Some things are hard to describe but easy to show. "Friendly but not gushing" means different things to different people. Two short examples of replies you liked tell the model more than a paragraph of adjectives.

Giving the model examples of the input and output you want is called **few-shot prompting**. "Zero-shot" means no examples; "one-shot" means one. The model picks up the pattern (format, length, tone, level of detail) and applies it to the new input.

## Before and after

**Telling:**

> Write product descriptions for our online shop. Keep them punchy and benefit-led, not too salesy.

**Showing:**

> Write a product description for the item below, in the same style as the examples.
>
> <example>
> Item: Stainless steel water bottle, 750ml
> Description: Keeps drinks cold through the working day. Fits most car cup holders. Dishwasher safe, so no scrubbing.
> </example>
>
> <example>
> Item: Wool beanie hat
> Description: Warm without the itch. One size stretches to fit. Folds flat into a coat pocket.
> </example>
>
> Item: [new item]
> Description:

The second version doesn't need "punchy" or "benefit-led". The examples show it: three short sentences, each a practical benefit, no exclamation marks.

## Choosing good examples

**Make them real.** Use examples of output you would actually send, ideally ones that went down well. Invented examples tend to be blander than the real thing.

**Make them diverse.** If every example is about a short, happy customer, the model learns that pattern too. Vary the length of the input, the topic and the difficulty. Include an awkward case: a complaint, an item with a drawback, a request you have to decline.

**Show the tricky decision.** If there is a judgement call you care about (say, when to escalate a query rather than answer it), include an example where the right answer is to escalate.

**Keep the format identical.** Label inputs and outputs the same way every time, so the pattern is unambiguous.

Start with two or three examples. Add more only if the output still misses something the examples could show.

## When examples over-constrain

Examples are powerful, which means they can pull too hard. Watch for:

- **Copying content, not style.** The model reuses phrases from your examples ("no scrubbing") in outputs where they don't belong.
- **Copying length.** Every output matches the example length, even when the input needs more or less.
- **Narrowing.** Every output follows the structure of your examples when a different structure would suit the new input better.
- **Copying mistakes.** A typo or bad habit in an example gets reproduced faithfully.

Fixes:

- Say what the examples are for: "Match the tone and length of these examples. Do not reuse their wording."
- Vary the examples so that the only thing they share is what you want copied.
- Drop the examples and use a clear description if you want variety more than consistency.

## Examples and your workflow map

Look at your workflow map for steps where the output is judged on style or consistency: client emails, report commentary, ticket categories. These benefit most from examples. Keep a small file of good examples for each such step, and add to it when you produce something especially good. Over time, that file becomes one of the most useful things your team owns.

One caution: real examples may include customer names or confidential details. Remove or replace them before they go into a tool, in line with your organisation's rules.

## Try it now

Pick a task where you have struggled to describe the style you want. Find two or three real examples of good output, with personal details removed, including one harder case. Build a few-shot prompt with each example in the same labelled format, plus a line saying what to copy and what not to.

Run it on two new inputs. You are done when both outputs match the style you wanted without copying the examples' wording, or you have written down which example to change and why.`,
        microCheck: [
          {
            question: "What is few-shot prompting?",
            options: [
              "Giving the model a few examples of the input and output you want",
              "Keeping prompts short so the model has fewer chances to go wrong",
              "Running the same prompt a few times and picking the best answer",
              "Splitting a big task into a few small prompts run one by one",
            ],
            correctIndex: 0,
            explanation:
              "Few-shot means including a small number of worked examples so the model can copy the pattern. Running a prompt several times or chaining prompts are different techniques with different purposes.",
          },
          {
            question: "All your example replies are to short, happy customers. What risk does this create?",
            options: [
              "The model may handle complaints and long queries poorly",
              "The model will refuse to reply to any unhappy customers at all",
              "The model will ignore examples that are this similar",
              "The model will shorten every reply below the examples",
            ],
            correctIndex: 0,
            explanation:
              "The model learns from everything the examples share, including the easy, upbeat situation. Without a harder case to copy, it has no pattern for complaints or messy queries.",
          },
          {
            question: "Outputs keep reusing a phrase from one of your examples where it doesn't fit. What is the best fix?",
            options: [
              "Say to match tone and length but not reuse the wording",
              "Add more examples that all contain that very phrase",
              "Remove the task description and rely on the examples alone",
              "Ask the model to use more creative, unusual wording",
            ],
            correctIndex: 0,
            explanation:
              "Stating what the examples are for tells the model to copy the style, not the content. Asking for creative wording can pull the tone away from the examples you chose.",
          },
          {
            question: "When might you drop examples and use a description instead?",
            options: [
              "When you want variety more than consistency in the output",
              "When the output must closely match a strict house style guide",
              "When the task involves a judgement call you care about",
              "When you have real examples that went down well before",
            ],
            correctIndex: 0,
            explanation:
              "Examples pull outputs towards a pattern, which is what you want for consistency. When you want varied output, that pull works against you and a description can be the better tool.",
          },
          {
            question: "Why include an awkward case, such as a request you must decline, among your examples?",
            options: [
              "It shows the model how to handle the judgement call you care about",
              "It makes the model more polite across all of its other replies",
              "It stops the model copying the style of the easier examples",
              "It reduces the total number of examples the model needs to see",
            ],
            correctIndex: 0,
            explanation:
              "The hard cases are where the model is most likely to go wrong, so an example of the right decision is especially valuable. It does not replace the easier examples or change their influence.",
          },
        ],
      },
      {
        title: "Asking for structure",
        objective: "Request structured output (tables, checklists, labelled fields, headings) that is easy to check and reuse.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Structure makes output checkable

A page of flowing prose is pleasant to read and hard to check. Is every claim supported? Did it cover every item? Is anything missing? You have to read it all closely to find out.

Structured output (tables, checklists, labelled fields, headings) breaks the answer into pieces you can check one at a time and reuse elsewhere. It also makes gaps visible: an empty cell is easier to spot than a missing sentence.

## Four structures and when to use them

**Tables** for comparing several things on the same attributes.

> Compare the three supplier quotes below in a table with columns: Supplier, Total price, Delivery time, Payment terms, Anything unusual. If a quote does not state something, write "Not stated".

**Checklists** for anything someone will act on or verify.

> Turn this policy into a checklist for a new starter. One action per line. Start each line with a verb.

**Labelled fields** for pulling the same information from many documents.

> From the email below, fill in these fields exactly:
> Customer name:
> Order number:
> Problem:
> What they are asking for:
> Deadline mentioned (or "None"):

**Headings** for longer documents with a fixed shape.

> Write the briefing under these headings, in this order: Situation, Options, Risks, Recommendation. No other headings.

## Design for checking

A few habits make structured output far easier to verify:

- **Give every claim a home.** One claim per row or field, so you can tick them off.
- **Add a source column.** "Where in the document does this come from?" Module 3 builds on this.
- **Allow "unknown".** Tell the model what to write when information is missing: "Not stated", "Unclear", "Needs checking". Otherwise it may fill the cell with a guess, because an empty cell looks like failure.
- **Fix the values where you can.** For a category, list the allowed values: "Priority: High, Medium or Low". Free text is harder to sort and compare.
- **Ask for a flag column** for items the model found ambiguous. Treat it as a hint, not a measurement: models are not reliably calibrated about their own uncertainty.

## Before and after

**Before:**

> Read these five meeting notes and tell me what was agreed.

**After:**

> From the five meeting notes below, list every decision and action. Use a table with columns: Meeting date, Decision or action, Owner (or "Not assigned"), Due date (or "None"), Quote from notes. One row per item. Do not merge items from different meetings.

The first gives you a paragraph you must reread against the notes. The second gives you rows you can check against quotes, sort by owner and paste into a tracker.

## Structure for reuse

Think about where the output goes next on your workflow map. If it goes into a spreadsheet, ask for a table or comma-separated values. If it goes into a ticketing system, ask for the exact fields that system uses. If someone skims it on a phone, ask for short headings and bullets.

Matching the structure to the next step removes a reformatting job from someone's day, and every hand-off that needs reformatting is a place where errors creep in.

## A caution: structure looks authoritative

A neat table feels more trustworthy than a messy paragraph, even when the content is identical. That is a trap. A structured answer can be just as wrong; it only looks more finished. Structure makes checking easier. It does not replace it.

## Try it now

Take a task where you currently get prose back and then reorganise it yourself: meeting notes, a comparison, a set of emails. Rewrite the prompt to ask for a table or labelled fields, with an "unknown" value allowed and a source or quote column.

Run it. You are done when you have checked at least three rows against the original material and pasted the output into wherever it goes next without reformatting it.`,
        microCheck: [
          {
            question: "Why is a table with one claim per row easier to check than a paragraph?",
            options: [
              "You can verify each claim separately and spot empty cells",
              "Tables are generated with fewer errors than written prose",
              "The model is required to cite sources when using a table",
              "Tables are shorter, so there is simply less to read overall",
            ],
            correctIndex: 0,
            explanation:
              "Splitting claims into rows lets you tick them off one by one and makes gaps visible. A table is not more accurate than prose, and it does not force the model to cite anything unless you ask.",
          },
          {
            question: "Why tell the model what to write when information is missing, such as 'Not stated'?",
            options: [
              "Otherwise it may fill the cell with a guess to look complete",
              "Otherwise it will refuse to produce the table at all",
              "Otherwise the table cannot be pasted into a spreadsheet",
              "Otherwise the model will quietly drop that whole column entirely",
            ],
            correctIndex: 0,
            explanation:
              "Models tend to fill every slot they are given. A permitted 'unknown' value gives an honest alternative to a plausible guess, and makes the gaps easy for you to find.",
          },
          {
            question: "The AI returns a neat, well-formatted comparison table. What is the right attitude?",
            options: [
              "Check it as you would prose; a neat format isn't accuracy",
              "Trust it more, since structured output is generally more reliable",
              "Trust it if every row comes with a confidence rating",
              "Rewrite it as prose first, since tables hide mistakes",
            ],
            correctIndex: 0,
            explanation:
              "Structure makes checking easier but does not make content correct. The finished look of a table is exactly what can lower your guard, and confidence ratings are hints rather than guarantees.",
          },
          {
            question: "The output goes straight into a ticketing system. What should you ask for?",
            options: [
              "The exact fields the ticketing system uses, in its order",
              "A short paragraph that someone can copy into the ticket",
              "Headings and bullets that are easy to skim on a phone",
              "A table with as many columns as the model thinks would be useful",
            ],
            correctIndex: 0,
            explanation:
              "Matching the structure to the next step removes a reformatting job, and every reformatting step is a chance for errors. Leaving the columns to the model makes the output harder to reuse.",
          },
          {
            question: "How should you treat a model's 'confidence' or 'ambiguous' flag column?",
            options: [
              "As a hint about ambiguity, not a reliable measurement",
              "As an accurate probability that each row is correct",
              "As a reason to skip checking the rows marked high",
              "As meaningless, so it should never be asked for",
            ],
            correctIndex: 0,
            explanation:
              "Models are not reliably calibrated about their own uncertainty, so flags can point you at likely problems but cannot tell you which rows are safe. They are still useful for deciding where to look first.",
          },
        ],
      },
      {
        title: "Iterating like an engineer",
        objective: "Improve a prompt by testing one change at a time on a fixed set of inputs, logging results and saving the winner as a template.",
        durationMinutes: 30,
        contentType: "article",
        bodyMd: `## Tweaking versus iterating

Most people improve prompts by fiddling: change three things, run it once, decide it feels better. That makes it impossible to know which change helped, or whether anything did. The output of AI tools also varies from run to run, so one good result can be luck.

Iterating like an engineer means treating a prompt as something you test. It takes a little more discipline and much less time overall.

## Change one thing at a time

If you change the role, add an example and tighten the format all at once, and the output improves, you don't know which change did it. If it gets worse, you don't know what to undo.

Make one change per version: add a constraint, or swap an example, or reword the task. Then compare. It feels slow, but you learn what actually drives the output for your task, and that knowledge carries over to the next prompt.

## Build a small test set

Comparing versions only works if you run them on the same inputs. Collect a small test set: three to five real inputs for this task.

Choose them to cover the range:

- A typical, easy case.
- A long or messy one.
- An awkward one: missing information, a complaint, an edge case.
- One where you know exactly what the right answer is, so you can spot errors.

Run every prompt version on every input in the set. Where results vary a lot from run to run, run each version more than once before you judge it.

## Keep a prompt log

A prompt log is a simple record of what you tried and what happened.

| Version | Change made | Test inputs | What improved | What got worse | Keep? |
|---|---|---|---|---|---|
| v1 | Starting prompt | 1-4 | | Invented a deadline on input 3 | |
| v2 | Added "If information is missing, say so" | 1-4 | No invented deadlines | Slightly longer | Yes |
| v3 | Added example of a complaint reply | 1-4 | Tone on input 3 much better | Copied phrasing on input 1 | Change the example |

Keep the full text of each version, not just a note of the change. Earlier prompts are easy to lose in a long chat history.

## Compare side by side

Judge versions against what matters for the task, decided in advance. For a customer reply that might be: facts correct, tone right, under 120 words, clear next step. Score each output on those, even roughly (yes, partly, no). This stops you being swayed by whichever output reads most smoothly.

This links straight back to Module 1. The criteria come from the purpose of the step on your workflow map, and the test set is a small feedback loop that you control.

## Save what works as a template

When a version holds up across your test set, save it properly:

- The full prompt, with placeholders marked clearly: [CUSTOMER EMAIL].
- A line on what it is for and when not to use it.
- The date, and the tool and model you tested it with. Models change, and a prompt that worked well may behave differently after an update.
- Known weaknesses: "Struggles with emails in more than one language".

Store templates where your team can find them. A shared folder with a consistent naming scheme beats a hundred prompts scattered across individual chat histories.

When the tool or model changes, rerun your test set before trusting the template again. That is the payoff of having one: re-testing takes minutes, not a fresh round of guesswork.

## Try it now

Pick one prompt you use regularly. Gather three or four real test inputs, including one awkward case. Run your current prompt on all of them and note the problems in a prompt log. Then make one change, rerun every input and log the result.

You are done when your log has at least two versions compared on the same inputs, and the better one is saved as a template with a note on what it is for.`,
        microCheck: [
          {
            question: "You change the role, add an example and tighten the format, and results improve. What is the problem?",
            options: [
              "You can't tell which change helped, or if one made it worse",
              "Three changes at once always make a prompt far too long to use",
              "Improvements from several changes rarely last past a week",
              "Nothing, as long as the improved version is saved at once",
            ],
            correctIndex: 0,
            explanation:
              "With several changes at once you cannot attribute the result, so you learn nothing reusable and cannot undo a harmful change. Saving the version does not fix that.",
          },
          {
            question: "Why run each prompt version on the same set of inputs?",
            options: [
              "So differences come from the prompt, not from the inputs",
              "So the model learns the inputs and improves over the runs",
              "So you use fewer tokens than you would with new inputs",
              "So the results can be shared with colleagues more easily",
            ],
            correctIndex: 0,
            explanation:
              "A fixed test set holds the inputs constant, so any change in quality can be traced to the prompt. Models in ordinary chat use do not learn from your earlier runs.",
          },
          {
            question: "Which input is most worth adding to a small prompt test set?",
            options: [
              "An awkward case with missing information or a complaint",
              "A second copy of the easiest, most typical input you have",
              "An invented input written to make the prompt look good",
              "The longest input you can find, whatever it happens to be",
            ],
            correctIndex: 0,
            explanation:
              "Awkward cases are where prompts break, so they reveal the most. Duplicates and flattering inputs hide weaknesses, and length alone does not test the judgement calls you care about.",
          },
          {
            question: "A saved template worked well for months. The tool then updates its model. What should you do?",
            options: [
              "Rerun your test set before trusting the template again",
              "Keep using it, since a prompt that works will keep working",
              "Rewrite the template from scratch for the new model",
              "Stop using templates, since models change too often",
            ],
            correctIndex: 0,
            explanation:
              "A model update can change how a prompt behaves, but it may also work fine. Rerunning the test set tells you which, quickly, without throwing away work that still holds up.",
          },
          {
            question: "Why decide your judging criteria before comparing prompt versions?",
            options: [
              "So you aren't swayed by whichever output reads most smoothly",
              "So the model can be told the criteria and optimise for them",
              "So the comparison takes less time than reading each output",
              "So each version only needs to be run once on every input",
            ],
            correctIndex: 0,
            explanation:
              "Fluent output is persuasive even when it misses what matters. Fixed criteria, taken from the purpose of the step, keep the comparison honest; you still need to read the outputs and may need repeat runs.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "Which prompt is most likely to hold up when a colleague runs it on a new input?",
        options: [
          "One with task, context, constraints and a fixed output format",
          "One that worked perfectly the first time you tried it yourself",
          "One that tells the model it is the leading expert in the field",
          "One that is as short as possible so it is quick to reuse",
        ],
        correctIndex: 0,
        explanation:
          "A prompt holds up when it carries everything the model needs rather than relying on the conversation it was written in. One good run and a flattering role are not evidence of reliability.",
      },
      {
        question: "Where should instructions go relative to long pasted material?",
        options: [
          "Before it, with the key instruction repeated after it",
          "After it only, so the model reads the material first",
          "Mixed into it, next to the parts they refer to most",
          "In a separate conversation, so the two are never confused",
        ],
        correctIndex: 0,
        explanation:
          "Leading with instructions frames how the material should be read, and repeating the key one afterwards keeps it close to where the model starts writing. Mixing them into the material blurs the boundary delimiters are meant to create.",
      },
      {
        question: "You want replies that are 'warm but brief'. Descriptions keep missing the mark. What is the most effective next step?",
        options: [
          "Show two or three real replies you liked as examples",
          "Add more adjectives describing the tone you want",
          "Ask the model what 'warm but brief' means to it",
          "Set a strict word limit and leave the tone to the model",
        ],
        correctIndex: 0,
        explanation:
          "Tone is easier to show than describe, which is what few-shot prompting is for. More adjectives rarely pin it down, and a word limit fixes length but not warmth.",
      },
      {
        question: "Your examples all happen to be three sentences long. Outputs are always three sentences, even for complex inputs. What is happening?",
        options: [
          "The examples are over-constraining the length",
          "The model cannot write more than three sentences",
          "The task description is too long for the model",
          "The inputs are too simple to need longer answers",
        ],
        correctIndex: 0,
        explanation:
          "The model copies everything the examples share, including length. Vary the example lengths or say that length should fit the input.",
      },
      {
        question: "Which request produces output that is easiest to check against meeting notes?",
        options: [
          "A table of decisions with owner, due date and a quote from the notes",
          "A clear paragraph summarising everything the meetings agreed on",
          "A bulleted list of the main themes discussed across the meetings",
          "A short narrative of how the discussion developed over the weeks",
        ],
        correctIndex: 0,
        explanation:
          "One item per row with a quote lets you verify each decision against its source. Paragraphs, themes and narratives all require rereading the notes to check.",
      },
      {
        question: "Why list the allowed values for a field, such as 'Priority: High, Medium or Low'?",
        options: [
          "Fixed values are easier to sort, compare and check",
          "The model cannot write free text in labelled fields",
          "Listing the values makes the model's ratings correct",
          "It stops the model from leaving any field blank",
        ],
        correctIndex: 0,
        explanation:
          "Consistent values make output usable in a spreadsheet or tracker and easy to scan. They do not make the model's judgement correct, which still needs checking.",
      },
      {
        question: "What is the main advantage of matching output structure to the next step on your workflow map?",
        options: [
          "It removes a reformatting job, and a place errors creep in",
          "It makes the output shorter and so cheaper to generate each time",
          "It means the next person no longer needs to check it",
          "It lets the model see the rest of the workflow as well",
        ],
        correctIndex: 0,
        explanation:
          "Each manual reformat is a chance to drop or change something. Matching the structure removes that step, but the content still needs checking at the hand-off.",
      },
      {
        question: "A prompt gave one excellent result. Why not save it as a template straight away?",
        options: [
          "Output varies, so one good run may be luck; test it more",
          "Templates should only come from prompts over a page long",
          "A prompt must be used for a month before being saved",
          "Excellent first results tend to get worse on each reuse",
        ],
        correctIndex: 0,
        explanation:
          "AI output varies between runs and inputs, so one success says little about reliability. Running it on a small test set, including awkward cases, is what earns it a place as a template.",
      },
      {
        question: "What belongs in a saved prompt template besides the prompt itself?",
        options: [
          "Its purpose, test date, tool and model, and known weaknesses",
          "The full chat history from the session where it was written",
          "A list of every colleague who has used it since it was saved",
          "The best output it produced, to paste in place of new ones",
        ],
        correctIndex: 0,
        explanation:
          "These notes tell the next user when to use it and when to re-test it, especially after a model change. A chat history or a usage list does not help anyone judge whether it still works.",
      },
      {
        question: "In a prompt log, what is the most important thing to record for each version?",
        options: [
          "The full prompt text and its results on the test inputs",
          "How long the prompt took you to write from the start",
          "Which colleague suggested the change and when they did",
          "The number of words in the prompt and in each output",
        ],
        correctIndex: 0,
        explanation:
          "Without the exact text you cannot go back to a version, and without results on the same inputs you cannot compare. The other details are rarely what decides which version to keep.",
      },
      {
        question: "A prompt you run every week feeds the bottleneck step on your workflow map. What does that suggest?",
        options: [
          "It deserves the full template, test set and prompt log",
          "It should be swapped for a faster prompt at an earlier step",
          "It matters less than the prompts you use for one-off tasks",
          "It should be kept as short as possible to save time",
        ],
        correctIndex: 0,
        explanation:
          "Prompts that run often at the constraint have the biggest effect on the whole system, so they repay careful testing. Speeding up an earlier step would just grow the queue at the bottleneck.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 3
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Working With Your Own Material",
    summary:
      "Use AI on your own documents and data without losing what matters: purposeful summaries, checked calculations, answers grounded in sources, and long documents handled in stages.",
    lessons: [
      {
        title: "Summarising without losing what matters",
        objective: "Write a summary prompt that states purpose and audience, extracts key facts and surfaces what is missing or uncertain.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## A summary is a decision about what to leave out

Every summary throws information away. The question is whether it throws away the right information. A summary of a contract written for a lawyer should keep different things from one written for the finance team.

When you ask "summarise this" with no more detail, the model decides what matters for you. It tends to keep what is prominent and repeated, and drop what is brief: the exception in a footnote, the caveat in the last paragraph, the one date that changes everything.

## State the purpose and the audience

Tell the model who the summary is for and what they will do with it.

**Before:**

> Summarise this supplier contract.

**After:**

> Summarise this supplier contract for our finance manager, who needs to decide whether to renew. Focus on: total cost, payment terms, price increase clauses, notice period for cancelling, and any penalties. Keep it under 200 words. If any of these topics is not covered in the contract, say "Not covered" rather than leaving it out.

The second version tells the model what to keep. It also makes the summary checkable: you can look for each named topic.

## Extract or summarise?

These are different jobs.

- **Extracting** pulls out specific information, ideally word for word: dates, amounts, names, obligations, the exact wording of a clause.
- **Summarising** condenses and rephrases the overall meaning.

Rephrasing is where subtle errors creep in. "The supplier may increase prices by up to 5% annually" can become "prices rise 5% a year", which is a different claim: a possible maximum has become a certainty. For anything with legal, financial or safety weight, extract first, and summarise only around the extracted facts.

A useful pattern is to ask for both, clearly separated:

> Part 1: Extract, word for word, every sentence that mentions payment, price or cancellation. Give the section number for each.
>
> Part 2: Using only Part 1, write a three-sentence summary for the finance manager.

## Ask what's missing or uncertain

A summary reads as complete even when it isn't. Ask the model to show its gaps:

> After the summary, list:
> - Anything in the document that is ambiguous or could be read two ways.
> - Topics a finance manager would expect to see that the document does not mention.
> - Anything you left out of the summary that someone might consider important.

This turns hidden omissions into a visible list you can judge. The model's list will not be complete, but it is a good prompt for your own reading.

## Check the summary against the source

Before you pass a summary on, especially to someone making a decision:

- Spot-check two or three specific claims against the original.
- Check every number, date and name.
- Read the end of the original and any appendices or footnotes, where exceptions often sit.
- Ask yourself: would the author of the original agree this is fair?

Look at your workflow map. If summaries cross a hand-off, the person receiving them usually cannot see the original. That makes the hand-off fragile, and your check is the last chance to catch a distortion.

Also check your organisation's rules before pasting documents into an AI tool. Contracts, personal data and client material may only be allowed in approved tools.

## Try it now

Take a real document you need to understand or pass on: a report, policy, contract or long email thread. Write a prompt that names the audience and purpose, lists the topics to keep, extracts key facts word for word with their locations, and asks for a list of gaps and ambiguities.

You are done when you have checked three extracted facts against the original, read the gaps list, and can say whether it caught anything you would otherwise have missed.`,
        microCheck: [
          {
            question: "You ask a tool to 'summarise this contract' with no other detail. What is the main risk?",
            options: [
              "It decides what matters and may drop brief but key exceptions",
              "It will refuse to summarise a legal document without a lawyer",
              "It will produce a summary longer than the original contract",
              "It will copy the contract word for word instead of condensing",
            ],
            correctIndex: 0,
            explanation:
              "Without a stated purpose the model keeps what is prominent and repeated. Short exceptions and caveats are exactly what tends to be dropped, and they are often what matters most.",
          },
          {
            question: "What is the difference between extracting and summarising?",
            options: [
              "Extracting pulls out specifics as written; summarising rephrases",
              "Extracting is for long documents; summarising is for short ones",
              "Extracting needs a special tool; summarising works in any chat",
              "Extracting is less accurate, because it lacks wider context",
            ],
            correctIndex: 0,
            explanation:
              "Extraction keeps the original wording, which protects meaning where precision matters. Summarising rephrases, which is where small shifts in meaning creep in.",
          },
          {
            question: "'The supplier may increase prices by up to 5% annually' becomes 'prices rise 5% a year'. What went wrong?",
            options: [
              "Rephrasing turned a possible maximum into a certainty",
              "Nothing; the summary is accurate, just written shorter",
              "The model converted the figure into the wrong unit",
              "The summary left out which supplier the clause covers",
            ],
            correctIndex: 0,
            explanation:
              "'May' and 'up to' make it a ceiling that might apply; the summary states a fixed increase. This is why clauses with financial weight should be extracted word for word.",
          },
          {
            question: "Why ask the model to list topics the document does not mention?",
            options: [
              "It makes hidden gaps visible so you can judge them yourself",
              "It guarantees that nothing important has been left out",
              "It shortens the summary by moving content into a list",
              "It proves the model has read every page of the document",
            ],
            correctIndex: 0,
            explanation:
              "A summary reads as complete even when it isn't, so an explicit gaps list gives you something to check. The list itself may be incomplete, so it prompts your judgement rather than replacing it.",
          },
          {
            question: "Summaries from your team go to a director who never sees the originals. What does this mean for your process?",
            options: [
              "That hand-off is fragile, so checks before it matter more",
              "The director should be sent summaries of summaries instead",
              "Checking matters less, because the director will review",
              "Summaries should be longer, so nothing can be distorted",
            ],
            correctIndex: 0,
            explanation:
              "The receiver cannot compare the summary with the source, so any distortion passes straight through. Your check before the hand-off is the last chance to catch it.",
          },
        ],
      },
      {
        title: "Asking questions of spreadsheets and data",
        objective: "Ask AI a question about your data with columns described and the method shown, then verify the result with a formula.",
        durationMinutes: 30,
        contentType: "article",
        bodyMd: `## The model cannot see what you can see

When you look at your spreadsheet, you know that "rev" is revenue in pounds, that a blank means zero and that the last row is a total. The model knows none of this. It guesses from column names and values, and plausible guesses can be wrong in ways that are hard to spot in the answer.

So the first habit is to describe your data.

## Describe the columns

Before asking anything, tell the model what each column means.

> The data below is a sales export. Columns:
> - A, date: order date, format DD/MM/YYYY
> - B, region: one of North, South, East, West
> - C, rev: order value in pounds, excluding VAT
> - D, status: Paid, Refunded or Pending
>
> Each row is one order. Refunded orders should be excluded from revenue. There is no total row.

This removes the most common misreadings: date formats, units, what a row represents, which rows to exclude. It also forces you to check that you understand the data yourself.

Check the file before you share it. Hidden rows, merged header cells, subtotal rows and notes typed into data columns all confuse analysis, whether by a person or a model.

## Ask for the method, not just the answer

A number on its own gives you nothing to check. Ask how it was reached.

**Before:**

> What was our best region last quarter?

**After:**

> Which region had the highest revenue from Paid orders between 1 April and 30 June? Before giving the answer, explain the method: which rows you included, which you excluded and why, and how you calculated the totals. Then give the total for each region.

Now you can see whether "best" was defined sensibly, whether refunds were excluded and whether the date range is right. If the method is wrong, the answer is wrong, however confident it sounds.

## Never trust computed totals blindly

Language models generate text by predicting what comes next. They are not calculators. When a model adds up a column "in its head", it can produce a total that looks right and isn't, and the risk grows with more rows and more steps.

Some AI tools can write and run code to do calculations, often described as a data analysis or code execution feature. This is much more reliable for arithmetic, because the code does the calculation rather than the model predicting it. It still needs checking: the code can filter the wrong rows or misread a column.

Whichever kind of tool you use, verify key figures yourself:

- **Recalculate with a formula.** If the AI gives a total for the North region, check it in your spreadsheet with a formula such as =SUMIFS(C:C, B:B, "North", D:D, "Paid").
- **Check the row count.** Ask how many rows it used and compare with =COUNTA or a filtered count. Missing or double-counted rows are a common cause of wrong totals.
- **Follow one row by hand.** Pick a row and trace it through the method.
- **Sense-check the size.** Is the answer roughly what you would expect? If one region is suddenly ten times the others, find out why before you report it.

If the AI wrote code, ask it to show the code and explain each step in plain words. You do not need to be a programmer to check that it filtered for "Paid" or used the right date range.

## Let the spreadsheet do the arithmetic

One of the most dependable uses of AI with data is not asking for answers at all, but asking for the formula, so that your spreadsheet does the calculation:

> I have order data with region in column B, revenue in column C and status in column D. Write a formula that totals revenue for Paid orders in the North region, and explain each part.

You can see the formula, test it on a few rows and reuse it next month. On your workflow map, this turns a step you would have to check every time into one you check once.

## Try it now

Take a real spreadsheet you work with, or a copy with sensitive columns removed and your organisation's rules checked. Write a column description, then ask one question that needs a calculation, asking for the method first.

Verify the answer with a spreadsheet formula and a row count. You are done when you have either confirmed the figure matches or found the reason it doesn't.`,
        microCheck: [
          {
            question: "Why describe each column's meaning and units before asking about a spreadsheet?",
            options: [
              "The model guesses otherwise, and plausible guesses can be wrong",
              "The model cannot read column headings unless they are described",
              "Descriptions make the model perform the arithmetic more quickly",
              "Most tools reject spreadsheets sent without a data dictionary",
            ],
            correctIndex: 0,
            explanation:
              "The model can read headings but not what they mean to you: units, date formats, which rows to exclude. Describing them removes the guesswork that leads to confident but wrong answers.",
          },
          {
            question: "An AI chat gives you a total for a 400-row column without using any code tool. How should you treat it?",
            options: [
              "As unverified until you recalculate it with a formula",
              "As correct, since adding numbers is easy for a model",
              "As correct if the model shows its working in the reply",
              "As approximate, but fine to report if it looks sensible",
            ],
            correctIndex: 0,
            explanation:
              "Without code, the model predicts the total as text, and slips become more likely with more numbers. Shown working can still contain an error, so a spreadsheet formula is the reliable check.",
          },
          {
            question: "The tool used code to calculate regional totals. What still needs checking?",
            options: [
              "Whether the code filtered the right rows and read the right column",
              "Nothing, because running code makes calculations fully reliable",
              "Only the formatting, since the code handles the numbers perfectly",
              "Whether the code was written in a language your team knows",
            ],
            correctIndex: 0,
            explanation:
              "Code does arithmetic reliably but does exactly what it was written to do. If it filtered the wrong rows or misread a column, the total is precisely calculated and still wrong.",
          },
          {
            question: "What is a quick check that catches missing or double-counted rows?",
            options: [
              "Compare the rows it used with a row count in your sheet",
              "Ask the model whether it is sure it used every row",
              "Rerun the same question and see if the totals match",
              "Round the total and check it looks a sensible size",
            ],
            correctIndex: 0,
            explanation:
              "A row count is an independent check against your own data. Asking the model to confirm, or rerunning the question, relies on the same process that may have made the error.",
          },
          {
            question: "Which is one of the most dependable ways to use AI for spreadsheet calculations?",
            options: [
              "Ask it for a formula, so the spreadsheet does the arithmetic",
              "Paste the numbers in and ask it to add them up very carefully",
              "Ask it for the total twice and use whichever answer repeats",
              "Ask it to round each value first so the sums are simpler",
            ],
            correctIndex: 0,
            explanation:
              "A formula moves the arithmetic to a tool built for it, and you can see and test it. Asking the model to be careful or to repeat itself does not change how it produces numbers.",
          },
        ],
      },
      {
        title: "Grounding answers in your sources",
        objective: "Ask questions of a document so that answers come with quotes and locations, and spot-check those citations.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Fluent is not the same as grounded

When you ask a question about a document, an AI tool can answer from two places: the document you gave it, and the general patterns it learned in training. The answer reads the same either way. A question about your leave policy might get an answer that sounds like your policy but is really a typical policy from somewhere else.

A **grounded** answer is one that comes from your source and can be traced back to it. For real work, grounded is what you need.

## Ask for quotes and locations

The simplest way to ground an answer is to ask for the evidence alongside it.

> Answer the question below using the attached staff handbook. For each point in your answer, give the section number and a short direct quote that supports it.

Quotes and section references do two jobs. They push the model to work from the text rather than from general knowledge. And they give you something you can check quickly.

## Tell it what to do when the answer isn't there

Models are inclined to give some answer rather than none. If the document doesn't cover the question, the model may fill the gap with something plausible. Give it an explicit way out:

> Answer only from the document provided. Do not use general knowledge. If the document does not answer the question, reply "The document does not say" and, if useful, name the closest section.

Then test that instruction. Ask a question you know the document doesn't answer. If you get a confident answer rather than "The document does not say", you have learned something important about how far to trust the tool on this material.

## A grounded prompt template

\`\`\`text
You are answering questions about the document below
for [audience].

Rules:
- Use only the document. Do not add general knowledge.
- For each point, give the section or page and a direct
  quote in quotation marks.
- If the document does not answer the question, say
  "The document does not say".
- If the document is ambiguous, say so and quote both
  readings.

Question: [your question]

<document>
[paste document]
</document>
\`\`\`

## Spot-check the citations

Asking for quotes is not the same as getting accurate quotes. Models can present a paraphrase as a quote, attach a real quote to the wrong section, or occasionally produce a quote that isn't in the document at all. The format looks rigorous whether or not the content is.

So check, at least a sample:

1. **Search for the exact quote** in the original (Ctrl+F or Cmd+F). If it isn't there word for word, treat the point as unsupported.
2. **Check the location.** Is the quote in the section it names?
3. **Check it supports the claim.** A real quote can be used to support something it doesn't say. Read the sentences around it.
4. **Look for contradictions elsewhere.** An exception two pages later can reverse the meaning.

How much to check depends on the stakes. For a quick internal question, checking one or two quotes may be enough. For anything going to a customer or a decision-maker, check every quote that carries weight. Checking at larger scale is covered later in the course.

## Grounding across your workflow

Look at your workflow map for hand-offs where someone receives an AI-assisted answer without the source. Grounded answers travel better: the quotes and section numbers go with them, so the next person can check without starting again. Make "include the quote and section" a standard part of any AI-assisted answer that crosses a hand-off.

Tools that search a collection of documents for you, such as those connected to a shared drive or knowledge base, work on the same principle. They find passages and answer from them. The same checks apply: are the cited passages real, relevant and complete?

## Try it now

Take a policy, handbook, contract or report you use at work. Using the template, ask three questions: two you know the answer to and one the document does not cover.

Check every quote with a text search. You are done when you have recorded, for each answer, whether the quotes were exact, correctly located and supportive, and whether the tool said "The document does not say" for the third question.`,
        microCheck: [
          {
            question: "What makes an answer 'grounded'?",
            options: [
              "It comes from your source and can be traced back to it",
              "It is written confidently, with no hedging or caveats",
              "It matches what the model learned in its training data",
              "It is long enough to cover every part of the question",
            ],
            correctIndex: 0,
            explanation:
              "Grounding is about where the answer comes from and whether you can trace it. A confident or thorough answer drawn from general training can still be wrong about your document.",
          },
          {
            question: "Why tell the model to reply 'The document does not say' when the answer is absent?",
            options: [
              "Otherwise it may fill the gap with a plausible general answer",
              "Otherwise it will stop reading the document part of the way",
              "Otherwise it will ask you too many clarifying questions back",
              "Otherwise it cannot give section numbers for its other points",
            ],
            correctIndex: 0,
            explanation:
              "Models lean towards giving some answer. An explicit way out lets them report a gap honestly instead of drawing on general knowledge that may not match your document.",
          },
          {
            question: "The model gives a quote with a section number. Your text search can't find the quote. What should you do?",
            options: [
              "Treat the point as unsupported until you find real support",
              "Accept it, since the model probably quoted a nearby sentence",
              "Accept it if the section number points to a relevant section",
              "Ask the model to confirm the quote and accept its confirmation",
            ],
            correctIndex: 0,
            explanation:
              "A quote that isn't in the document may be a paraphrase or an invention, and the claim it supports is unverified. Asking the model to confirm relies on the same process that produced the quote.",
          },
          {
            question: "A quote is real and appears in the named section. What else should you check?",
            options: [
              "That it actually supports the claim, read in its context",
              "That the quote is shorter than about twenty words long",
              "That quotation marks were used around it consistently",
              "Nothing more, as a real quote in the right place is enough",
            ],
            correctIndex: 0,
            explanation:
              "Real quotes can be stretched to support claims they don't make, or be reversed by nearby exceptions. Reading the surrounding text is what confirms the point.",
          },
          {
            question: "How can you test whether a tool respects 'answer only from the document'?",
            options: [
              "Ask a question you know the document does not answer",
              "Ask the model whether it followed your instruction",
              "Ask the same question twice and compare the answers",
              "Ask it to repeat the instruction back before replying",
            ],
            correctIndex: 0,
            explanation:
              "Only a question with no answer in the document shows whether the model admits the gap or fills it. Self-reports and repeated runs do not reveal that behaviour.",
          },
        ],
      },
      {
        title: "Long documents and context limits",
        objective: "Handle a long document by chunking it, summarising in stages and checking what was lost.",
        durationMinutes: 30,
        contentType: "article",
        bodyMd: `## What a context window is

An AI model can only consider a limited amount of text at once. That limit is its **context window**. Think of it as the model's desk: everything it can look at while answering has to fit on the desk at the same time.

Everything counts towards it: your instructions, any documents you paste or upload, the earlier messages in the conversation, and the reply the model is writing. The size is measured in **tokens**, which are chunks of text, often a short word or part of a longer one.

Context windows vary between tools and models, and they change over time. Check your tool's documentation for the current figure rather than relying on a number you read somewhere.

## What happens when you hit the limit

Different tools handle overflow differently, and not always visibly:

- Some refuse or warn you that the file is too long.
- Some cut the document, so the model only sees part of it.
- Some drop or compress the earliest messages in a long conversation, so instructions you gave at the start quietly stop applying.
- Some search the document and pass only the most relevant-looking passages to the model.

Each of these means the model may answer confidently from part of your material while you believe it read all of it.

Even well within the limit, a very long input is harder to use well. Details buried in the middle of a long document can be overlooked, and a single brief exception is easy to miss among hundreds of pages.

## Chunking: split it deliberately

If a document is long, split it yourself rather than letting the tool decide. Split along natural boundaries: chapters, sections, months, one email thread at a time. Keep the headings with each chunk so the model knows where it is.

Give each chunk the same instructions and the same output format, so the results can be combined. Label each output with the chunk it came from.

## Summarising in stages

For a long report you can summarise in two stages:

1. **Stage one:** for each chunk, extract the key facts, figures, decisions and caveats in a fixed format, with section references.
2. **Stage two:** give the model all the stage-one outputs together and ask for the overall summary.

\`\`\`text
Stage one prompt (run once per chunk):

This is section [N] of [total] of [document name].
Extract: key facts, figures with units, decisions,
risks, and any exceptions or caveats.
Use bullet points. Give the page or section for each.
Do not summarise beyond this section.

<section>
[paste chunk]
</section>
\`\`\`

Staging keeps each step small enough to check, and the stage-one notes become a useful index of the document in their own right.

## What gets lost, and how to check

Each round of summarising loses detail. The things most at risk are:

- **Exceptions and caveats**: "except in Scotland", "unless agreed in writing".
- **Numbers and units**, especially when similar figures appear in different sections.
- **Cross-references**: a term defined in section 2 and used in section 9.
- **Disagreement**: where two sections say different things, a summary tends to smooth it over.

Ways to check:

- **Ask for coverage.** "List the section headings you used." Compare with the real contents page.
- **Ask a test question.** Pick a specific detail from the middle or end of the document and ask about it. If the answer is wrong or vague, the tool is not seeing everything.
- **Trace a number.** Take one figure from the final summary and find it in the original.
- **Watch long conversations.** If the model starts ignoring an early instruction, restate it, or start a fresh conversation with the key instructions and the summary so far.

On your workflow map, any step that feeds a long document into AI should have a checkpoint for coverage, not just accuracy. An accurate summary of half the document is still a wrong summary.

## Try it now

Take the longest document you work with regularly. Split it into chunks along its sections, run a stage-one extraction on each, then a stage-two summary.

Then ask the tool a test question about a specific detail from near the end. You are done when you have compared the stage-two summary's section list with the real contents and confirmed whether the test detail was answered correctly.`,
        microCheck: [
          {
            question: "What counts towards a model's context window?",
            options: [
              "Instructions, documents, earlier messages and the reply",
              "Only the documents you paste or upload into the chat",
              "Only your latest message, not any of the earlier conversation",
              "Only the reply, since the model reads input separately",
            ],
            correctIndex: 0,
            explanation:
              "Everything the model considers at once shares the same window, including the conversation so far and the reply it is writing. That is why long chats can crowd out earlier instructions.",
          },
          {
            question: "You upload a long report and get a confident summary. What is a hidden risk?",
            options: [
              "The tool may have seen only part of it without telling you",
              "The tool will have added pages from similar reports it knows",
              "Confident summaries are always less accurate than cautious ones",
              "The upload makes the report part of the model's permanent memory",
            ],
            correctIndex: 0,
            explanation:
              "Tools may truncate long files or pass only selected passages, and the summary can sound complete regardless. Checking coverage is how you find out.",
          },
          {
            question: "Deep into a long conversation, the model starts ignoring an instruction you gave at the start. What is a likely cause?",
            options: [
              "Early messages were dropped or diluted as the chat grew",
              "The model decided the instruction no longer applied",
              "The instruction expired after a set number of turns",
              "The provider updated the model partway through the conversation",
            ],
            correctIndex: 0,
            explanation:
              "As a conversation grows, early material can be dropped, compressed or given less attention. Restating the instruction, or starting fresh with a summary, brings it back into view.",
          },
          {
            question: "Why summarise a long document in stages rather than all at once?",
            options: [
              "Each step stays small enough to check, and notes form an index",
              "Staged summaries are guaranteed to include every detail",
              "Tools charge less for several short prompts than for one long one",
              "Models can only summarise a single section at any one time",
            ],
            correctIndex: 0,
            explanation:
              "Staging keeps each piece within easy reach of both the model and your checks. It reduces loss but does not guarantee completeness, so coverage still needs checking.",
          },
          {
            question: "Which detail is most at risk when summaries are combined in stages?",
            options: [
              "A caveat such as 'unless agreed in writing'",
              "The title of the document and its author",
              "The main topic that every single section is about",
              "The headings at the top of each chunk",
            ],
            correctIndex: 0,
            explanation:
              "Short caveats and exceptions are easy to drop at each round of condensing, yet they can change the meaning. Main topics and headings are repeated and prominent, so they tend to survive.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "You need a summary of a policy for new starters. Which addition improves it most?",
        options: [
          "State the audience, purpose and topics it must cover",
          "Ask for the summary to be as short as it can be",
          "Ask the model to act as an expert policy writer",
          "Ask for the summary in a friendly and upbeat tone throughout",
        ],
        correctIndex: 0,
        explanation:
          "Purpose and audience tell the model what to keep, and named topics make the summary checkable. Length, role and tone shape the style but not what gets left out.",
      },
      {
        question: "For a contract clause with financial weight, what is the safer approach?",
        options: [
          "Extract the exact wording first, then summarise around it",
          "Ask for a plain-English paraphrase of that clause alone",
          "Summarise the whole contract and read the summary closely",
          "Ask the model to rate how important each clause might be",
        ],
        correctIndex: 0,
        explanation:
          "Paraphrasing is where meaning shifts, such as a maximum becoming a certainty. Keeping the exact wording means the summary can be checked against the clause itself.",
      },
      {
        question: "Your data has dates in DD/MM/YYYY format. Why mention this to the model?",
        options: [
          "It might read 03/04 as 4 March rather than 3 April",
          "Models cannot process dates that contain slashes",
          "It makes the model convert all dates into plain text",
          "Spreadsheet tools require the format in the prompt",
        ],
        correctIndex: 0,
        explanation:
          "Day-first and month-first formats look identical for many dates, so a model may assume the wrong one. Stating the format removes a silent error that would skew any date-range question.",
      },
      {
        question: "Before accepting 'the North region was the best performer', what should you ask for?",
        options: [
          "The method: which rows were included, excluded and how",
          "A more confident restatement of the answer in the reply",
          "A chart of the result that you can paste into a report",
          "A list of the other regions that nearly did as well",
        ],
        correctIndex: 0,
        explanation:
          "The method shows whether 'best' was defined sensibly and the right rows were used. A chart or a restatement just presents the same possibly flawed answer more persuasively.",
      },
      {
        question: "Which check verifies an AI-computed regional total most directly?",
        options: [
          "A SUMIFS formula in the spreadsheet over the same rows",
          "Asking the model to double-check its own arithmetic again",
          "Asking a second AI tool to add up the same numbers",
          "Checking the total uses the right currency format",
        ],
        correctIndex: 0,
        explanation:
          "A formula recalculates the figure independently with a tool built for arithmetic. Asking the same or another model repeats the kind of process that may have made the error.",
      },
      {
        question: "Why ask for a short direct quote with each point in an answer about a handbook?",
        options: [
          "It pushes the answer towards the text and makes checks quick",
          "It guarantees the answer is correct, since quotes are copied",
          "It shortens the answer, since quotes replace explanations",
          "It lets the reader avoid opening the original document",
        ],
        correctIndex: 0,
        explanation:
          "Quotes anchor the answer to your source and give you something to search for. They are not guaranteed accurate, which is why you still spot-check them.",
      },
      {
        question: "A cited quote is genuine, but two pages later an exception reverses its meaning. What does this show?",
        options: [
          "Real quotes can still mislead; check the surrounding text",
          "The model's citation was fabricated and should be deleted",
          "Exceptions don't matter when the main rule is quoted exactly",
          "The document is too badly written to be relied on at all",
        ],
        correctIndex: 0,
        explanation:
          "A quote can be accurate and still give the wrong impression without its context. Checking for exceptions and contradictions elsewhere is part of verifying a grounded answer.",
      },
      {
        question: "What is a context window, in plain terms?",
        options: [
          "The amount of text a model can consider at one time",
          "The time period covered by the model's training data",
          "The part of the screen where the conversation appears",
          "The number of files a tool can store for later use",
        ],
        correctIndex: 0,
        explanation:
          "The context window is the model's working space for one response, covering instructions, documents, conversation and reply. The training cut-off is a different idea.",
      },
      {
        question: "Your tool may pass only the most relevant-looking passages of a long document to the model. What should you check?",
        options: [
          "Coverage: whether the answer drew on all relevant parts",
          "Speed: whether the answer came back faster than usual",
          "Tone: whether the answer matches the document's style",
          "Length: whether the answer is roughly as long as it usually is",
        ],
        correctIndex: 0,
        explanation:
          "If the tool selects passages, an answer can be accurate about what it saw and still miss the part that matters. Coverage checks, such as a test question, reveal that.",
      },
      {
        question: "How should you split a long document into chunks?",
        options: [
          "Along sections or chapters, keeping each chunk's heading",
          "Into equal word counts, whatever the section boundaries",
          "At random, so each chunk has a mix of different topics",
          "Only at the midpoint, so there are always two chunks",
        ],
        correctIndex: 0,
        explanation:
          "Natural boundaries keep related material together, and headings tell the model where it is. Cutting mid-section can split a rule from its exception.",
      },
      {
        question: "Which test best shows whether a tool really took in a whole long document?",
        options: [
          "Ask about a specific detail from near the middle or end",
          "Ask the tool to confirm that it has read the whole file carefully",
          "Ask for a summary and check that it sounds complete",
          "Check how quickly the tool responded to the upload",
        ],
        correctIndex: 0,
        explanation:
          "A specific detail from late in the document either comes back correctly or it doesn't. Self-confirmation and a complete-sounding summary tell you nothing about what was actually read.",
      },
    ],
  },
];
