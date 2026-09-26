# The 30-Day AI Pilot Playbook

**TIBLOGICS** · A pilot that produces evidence, not enthusiasm.

Most AI pilots fail in a specific way: they "work", everyone is impressed,
and nobody can say whether they should be rolled out. This playbook is built
to avoid that single failure mode.

---

## Before day 1: the two questions

Do not start until both are answered in writing.

**1. What number should move?**
Not "improve efficiency". A number, its current value, and how you measured
it. If you cannot measure it today, you cannot prove a change tomorrow.

> Bad: "Reduce time spent on support."
> Good: "Median first-response time is currently 4h 20m, measured from the
> helpdesk export for the last 60 days."

**2. What would make us stop?**
Agree the kill criterion *before* anyone is emotionally invested. Write it
down and name who applies it.

> "If median first-response time has not fallen below 3h by day 30, we stop
> and write up what we learned. [NAME] makes that call."

A pilot without a kill criterion is not a pilot. It is a procurement decision
already made.

---

## Days 1–3: Baseline

- Export 60 days of real data for your chosen metric
- Record median and 90th percentile, not just the average — averages hide the
  cases that actually annoy people
- Note anything unusual in the period (holidays, an outage, a big launch)
- Have one person who does the work daily review your baseline and confirm it
  matches their experience

**If the person doing the job says your baseline looks wrong, they are right
and your data is wrong.** Fix it before proceeding.

---

## Days 4–7: Narrow the scope

Pick the smallest version that could still prove the point.

- One team, not a department
- One category of work, not all of it
- Volunteers, not conscripts

Write a one-page scope: what's in, what's explicitly out, who is involved,
and what they've been asked to do differently.

**Common mistake:** scoping so broadly that a positive result is
unattributable. If five things changed, you have learned nothing about any of
them.

---

## Days 8–21: Run it

Rules for the running period:

1. **Do not change the scope mid-pilot.** Note the temptation and the reason;
   it is data about what people actually needed.
2. **Log failures as carefully as successes.** The failure modes are what
   tell you whether this survives contact with scale.
3. **Weekly 20-minute check-in.** Three questions only: what worked, what
   didn't, what surprised you.
4. **Keep a decision log.** Every judgement call, dated, with its reason.

### What to record daily

| Field | Why |
|---|---|
| Volume handled | Compare against baseline volume, not just quality |
| Time taken | The metric you committed to |
| Corrections needed | How much human rework the output actually required |
| Anything refused or escalated | Where the boundary genuinely is |
| Notable failure | Verbatim, not summarised |

The "corrections needed" column is the one people skip, and the one that
usually decides whether the pilot is real. Output that needs 40% rework is
not a time saving.

---

## Days 22–26: Measure

Re-run the exact same measurement as your baseline. Same query, same period
length, same exclusions.

Then answer, honestly:

- Did the number move?
- Did it move *because of this*, or did something else change?
- What did it cost — licences, time, and the rework in your daily log?
- What broke, and how often?
- Would the people doing the work want to keep it?

That last question is not sentiment. A tool the team quietly stops using has
a real ROI of zero regardless of what the numbers say.

---

## Days 27–30: Decide and write it up

Write one page. Not a deck.

```
PILOT: [name]
METRIC: [what] — baseline [x] → result [y]
COST: [licences + time + rework]
DECISION: [roll out / extend / stop]
WHY: [two sentences]
WHAT WE LEARNED: [three bullets, including at least one thing that surprised us]
```

**Circulate it whatever the outcome.** A written-up stopped pilot is more
valuable to your organisation than a rolled-out one nobody understands — it
stops someone re-running the same experiment in eight months.

---

## The three ways this goes wrong

**1. The metric moves but nobody can say why.**
You changed more than one thing. Next time, change one.

**2. It works brilliantly for the volunteer who loves it.**
You measured the enthusiast, not the process. Check whether it works for the
person who was indifferent.

**3. Everyone agrees it was a success and nothing is decided.**
You had no kill criterion, so there was never a decision point. Set one next
time, before you start.

---

## Pilot scope — one page

```
PILOT NAME:
OWNER:                          KILL-CRITERION HOLDER:
START DATE:                     REVIEW DATE:

THE NUMBER
  Metric:
  Current value:                How measured:
  Target:

SCOPE
  In:
  Explicitly out:
  People involved:

KILL CRITERION
  We stop if:

COST BUDGET
  Licences:        Time:        Acceptable rework:
```

---

*Supplied by TIBLOGICS. Adapt freely inside your organisation.*
