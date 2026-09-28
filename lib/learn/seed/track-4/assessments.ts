import type { SeedCapstone, SeedFinalExam, SeedLab } from "../types";

// Vibe Coding Like a Software Engineer: labs, final exam and capstone.
// Every assessment tests what Modules 1-6 teach, in their terms. The system
// map from Module 1 is the thread: the spec, the build loops, the tests, the
// security review and the handover all refer back to it. All apps, people and
// organisations in scenarios are fictional and illustrative.
//
// Code-lab checks run in the learner's browser against the live preview. Each
// check is the BODY of an async function (doc, win). The helper prefixes below
// are prepended to every check in a lab, so each check guards its own
// elements and sets every input it relies on (checks run in order on the same
// page). Reference solutions live in ./solutions.ts (testing only).

// ── Check helpers (prepended to each check body) ──────────────────────────

const H_BILL = `const $ = (id) => doc.getElementById(id);
for (const id of ["bill", "tip", "people", "total", "each", "error"]) {
  if (!$(id)) return "No element with id " + id;
}
const set = (id, v) => {
  const el = $(id);
  el.value = v;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
};
const wait = () => new Promise((r) => setTimeout(r, 60));
const shown = (el) => {
  if (el.hidden) return false;
  const s = win.getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && el.textContent.trim().length > 0;
};
`;

const H_LIST = `const $ = (id) => doc.getElementById(id);
for (const id of ["item", "add", "list", "count"]) {
  if (!$(id)) return "No element with id " + id;
}
const wait = () => new Promise((r) => setTimeout(r, 60));
const items = () => Array.from($("list").querySelectorAll("li"));
const count = () => {
  const m = $("count").textContent.match(/\\d+/);
  return m ? Number(m[0]) : NaN;
};
const add = async (text) => {
  const i = $("item");
  i.value = text;
  i.dispatchEvent(new win.Event("input", { bubbles: true }));
  $("add").click();
  await wait();
};
const removeItem = async (li) => {
  const b = li.querySelector("button");
  if (!b) return false;
  b.click();
  await wait();
  return true;
};
const reset = async () => {
  for (let g = 0; g < 50 && items().length; g++) {
    if (!(await removeItem(items()[0]))) return false;
  }
  return items().length === 0;
};
if (!(await reset())) return "Could not clear the list: each item must be an li inside #list with its own remove button";
`;

const H_FORM = `const $ = (id) => doc.getElementById(id);
for (const id of ["name", "email", "comment", "submit", "list", "error"]) {
  if (!$(id)) return "No element with id " + id;
}
const wait = () => new Promise((r) => setTimeout(r, 60));
const set = (id, v) => {
  const el = $(id);
  el.value = v;
  el.dispatchEvent(new win.Event("input", { bubbles: true }));
};
const submit = async (name, email, comment) => {
  set("name", name);
  set("email", email);
  set("comment", comment);
  $("submit").click();
  await wait();
};
const shown = (el) => {
  if (el.hidden) return false;
  const s = win.getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && el.textContent.trim().length > 0;
};
const snap = () => $("list").children.length + "|" + $("list").textContent;
`;

// ═══════════════════════════════════════════════════════════════════════════
// LABS (one per module)
// ═══════════════════════════════════════════════════════════════════════════

export const TRACK_4_LABS: SeedLab[] = [
  // ── Module 1 ──────────────────────────────────────────────────────────
  {
    slug: "vibe-coding-lab-1-map-the-system",
    title: "Map the system around your app idea",
    labType: "workbench",
    moduleNumber: 1,
    estimatedMinutes: 35,
    points: 60,
    passScore: 70,
    briefMd: `Module 1 made one point above all: the code is the smallest part of the system. An app that works on your laptop still needs users who can reach it, data that goes somewhere safe, services it depends on, a place to run, a person who looks after it and a plan for the day it breaks.

Before you write a single prompt, map that system for an app you actually want to build. Work through the fields in order. Be concrete: name the real users, the real data and the real services, even if the answer is "I do not know yet". An honest gap on the map is worth more than a confident guess, because it tells you what to decide before you build.

You are assessed on how completely and honestly you see the system around the code, not on how impressive the idea is. This map is the one the later labs and the capstone build on.`,
    scenarioMd: `Use an app idea of your own if you have one: something small enough to build in a few weekends, that at least one other person would use.

If you have no idea ready, use this illustrative one and say so: *imagine a small community choir that wants a simple web app where members mark which rehearsals they can attend, and the choir leader sees a count for each date and gets an email reminder the day before.* It has two kinds of user, stores members' names and email addresses, sends email through an outside service, and would be looked after by a volunteer.

Hint from the lesson: data in, data out, integrations, where it runs, who maintains it, what happens when it breaks, and one feedback loop.`,
    objectives: [
      {
        id: "users-data",
        label: "Identifies the users and the data flowing in and out",
        weight: 3,
        guidance:
          "Full credit when the learner names at least two kinds of user (or explains why there is only one), what each can see and do, every piece of data that comes in and goes out, where it is stored, and marks which data is personal. Part credit if users are named but data is vague ('user info'). Low credit for a feature list with no users or data.",
      },
      {
        id: "integrations-runtime",
        label: "Names integrations, where it runs and who maintains it",
        weight: 3,
        guidance:
          "Full credit for naming each outside service the app depends on (email, payments, database host, AI API, login provider) with what it is used for, where the app will run (a hosting provider, an app builder's platform, a laptop), which accounts and keys are involved, and a named person who maintains it and how much time they have. Part credit if hosting or ownership is missing. Low credit for 'it runs online'.",
      },
      {
        id: "failure",
        label: "Thinks through what happens when it breaks",
        weight: 2,
        guidance:
          "Full credit for at least two realistic failure cases (an outside service down, bad input, a lost key, data deleted, the maintainer unavailable), who notices and how, the impact on users, and a first response for each. Part credit for one failure case or failures with no response. None for 'it should not break'.",
      },
      {
        id: "loop",
        label: "Describes a genuine feedback loop in the system",
        weight: 2,
        guidance:
          "Full credit for one loop written with arrows that circles back to its start (for example: more members -> more reminders -> more attendance -> more members), correctly labelled reinforcing or balancing with a reason, plus one sentence on what it means for how the app should be built or run. Part credit for a one-way chain called a loop or a missing label.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "idea",
          label: "The app and its purpose",
          prompt:
            "Describe the app in two or three sentences: the problem it solves, for whom, and what 'working' would mean for them. If you are using the illustrative choir app, say so.",
          placeholder:
            "e.g. A rehearsal attendance app for a community choir. Members mark which dates they can make; the leader sees numbers per date...",
          minWords: 40,
        },
        {
          id: "users-data",
          label: "Users and data in and out",
          prompt:
            "List each kind of user and what they can see and do. Then list the data that comes in (who enters it), the data that goes out (to whom), where it is stored, and mark every piece of personal data.",
          minWords: 60,
        },
        {
          id: "integrations",
          label: "Integrations, where it runs and who maintains it",
          prompt:
            "Name every outside service the app relies on and what for, where the app will run, which accounts and API keys are involved, and who will maintain it once it is live (and how much time they really have).",
          minWords: 50,
        },
        {
          id: "failure",
          label: "When it breaks",
          prompt:
            "Describe at least two realistic ways the system could fail (not only the code). For each: who notices, how, what users experience, and what the first response is.",
          minWords: 50,
        },
        {
          id: "loop",
          label: "One feedback loop",
          prompt:
            "Write one feedback loop in this system with arrows (A -> B -> C -> back to A). Label it reinforcing or balancing and say why. Then say what that loop means for how you should build or run the app.",
          minWords: 40,
        },
      ],
    },
  },

  // ── Module 2 ──────────────────────────────────────────────────────────
  {
    slug: "vibe-coding-lab-2-write-a-build-ready-spec",
    title: "Write a spec an AI can build from",
    labType: "workbench",
    moduleNumber: 2,
    estimatedMinutes: 45,
    points: 70,
    passScore: 70,
    briefMd: `"Build me an app that..." is a wish, not a spec. The AI will fill every gap with its own guesses, and you will spend the next week undoing them. Module 2 showed the alternative: decide what you want, in a form that can be checked, before you prompt.

Write a build-ready spec for a small app. It can be the app you mapped in Lab 1, or the illustrative one below. Your spec needs a clear problem and users, three to five user stories, acceptance criteria in Given/When/Then form, explicit non-goals, the first three small build steps, and a definition of done.

You are assessed on whether a coding assistant (or another person) could build from your spec without guessing, and whether you could tell, from the spec alone, when each part is finished.`,
    scenarioMd: `If you have no app of your own ready, use this illustrative one and say so: *a simple reading log where one person records the books they have read (title, author, date finished, a rating from 1 to 5) and sees how many books they have finished this year.* It runs in the browser only, with no accounts.

Reminders from the lessons:

- A user story: *As a [user], I want [something] so that [reason].*
- An acceptance criterion: *Given [a starting state], when [an action], then [an observable result].*
- A small step is a vertical slice: one thing a user can do, end to end, that you can run and check.`,
    objectives: [
      {
        id: "stories",
        label: "User stories tied to real users and outcomes",
        weight: 2,
        guidance:
          "Full credit for three to five user stories in 'As a... I want... so that...' form, each naming a real user and a reason that matters to them, together covering the core of the app and nothing more. Part credit if the stories are really technical tasks ('As a developer I want a database') or have no reason. Low credit for a feature list.",
      },
      {
        id: "criteria",
        label: "Testable acceptance criteria, including edge cases",
        weight: 3,
        guidance:
          "Full credit when every story has at least one Given/When/Then criterion with an observable result a person could check in seconds, and at least two criteria cover edge or error cases (empty input, invalid values, limits, nothing to show). Part credit if criteria exist but some results are vague ('works correctly', 'is user-friendly') or no edge cases appear. None if there are no criteria.",
      },
      {
        id: "scope",
        label: "Clear scope: non-goals and constraints",
        weight: 2,
        guidance:
          "Full credit for at least three explicit non-goals (for example no accounts, no payments, no mobile app in this version), plus constraints an AI needs: the stack or tool, where data is stored, and a simple data model (the main things and their fields). Part credit for non-goals without constraints or vice versa. Low credit for 'keep it simple'.",
      },
      {
        id: "steps",
        label: "Small, checkable first build steps",
        weight: 2,
        guidance:
          "Full credit for three first steps that are each a thin vertical slice a user could see working (for example 'add one book and see it listed'), in a sensible order, each with what will be checked before moving on. Part credit for steps that are layers ('build the database', 'do the UI') or too large to check in one sitting.",
      },
      {
        id: "done",
        label: "A definition of done that can be verified",
        weight: 1,
        guidance:
          "Full credit for a definition of done that includes all acceptance criteria passing, named edge cases checked, code committed, and where it will run or be handed over. Part credit for 'when it works' plus one concrete item. None for 'when the AI says it is finished'.",
      },
    ],
    config: {
      kind: "workbench",
      fields: [
        {
          id: "problem",
          label: "Problem, users and context",
          prompt:
            "What problem does the app solve, for whom, and in what situation will they use it? Give the context an AI would need: who the users are, what device they will use, and anything they already use today.",
          minWords: 40,
        },
        {
          id: "stories",
          label: "User stories",
          prompt:
            "Write three to five user stories in the form 'As a [user], I want [something] so that [reason].'",
          minWords: 40,
        },
        {
          id: "criteria",
          label: "Acceptance criteria (Given/When/Then)",
          prompt:
            "For each user story, write at least one acceptance criterion in Given/When/Then form. Include at least two criteria for edge or error cases, such as empty input, invalid values or nothing to show yet.",
          minWords: 80,
        },
        {
          id: "scope",
          label: "Non-goals, stack and data model",
          prompt:
            "List at least three things this version will deliberately not do. Then state the stack or tool you will build with, where the data will be stored, and a simple data model: the main things the app stores and their fields.",
          minWords: 50,
        },
        {
          id: "steps",
          label: "First three build steps",
          prompt:
            "Write the first three small build steps you would give the AI, in order. Each should be something a user can see working, and say what you will check before moving to the next step.",
          minWords: 50,
        },
        {
          id: "done",
          label: "Definition of done",
          prompt:
            "Write the definition of done for this version: the conditions that must all be true before you call it finished.",
          minWords: 25,
        },
      ],
    },
  },

  // ── Module 3 ──────────────────────────────────────────────────────────
  {
    slug: "vibe-coding-lab-3-bill-splitter",
    title: "Build a bill splitter in small steps",
    labType: "code",
    moduleNumber: 3,
    estimatedMinutes: 45,
    points: 70,
    passScore: 70,
    briefMd: `Build a small bill splitter in the Code Studio, working the way Module 3 taught: **one change, run, check, then move on**. Use the AI pair programmer, but ask for one small step at a time, read every change before you accept it, and reject anything you did not ask for.

The page must use these ids (the automated checks look for them):

- \`#bill\`: a number input for the bill amount.
- \`#tip\`: a number input for the tip, as a percentage (10 means 10%).
- \`#people\`: a number input for how many people are splitting.
- \`#total\`: an element showing the total including tip, to 2 decimal places.
- \`#each\`: an element showing the amount per person, to 2 decimal places.
- \`#error\`: a message element. When the bill is empty or negative, or people is less than 1, it must show a clear message. When the inputs are valid again, it must be empty or hidden.

The results must **update as the user types** (on the \`input\` event), with no calculate button.

Example: a bill of 100 with a 10% tip split between 4 people gives a total of 110.00 and 27.50 each.

Keep a build log as you go: the steps you took, what you checked after each one, and at least one change the AI suggested that you rejected or corrected, and why.`,
    scenarioMd: `Suggested small steps (you may choose your own):

1. Add the three inputs and the two result elements. Run it. Check the ids.
2. Calculate the total for one example by hand, then make the page show it. Check it matches.
3. Add the per-person amount and the 2 decimal places. Check a case that needs rounding (10 with a 15% tip between 3 people should give 3.83 each).
4. Add the error message for bad input. Check it appears, and that it disappears when you fix the input.

Run the automated checks after each step, not only at the end.`,
    objectives: [
      {
        id: "works",
        label: "The calculator is correct, including rounding",
        weight: 3,
        guidance:
          "Graded mainly from the automated checks: correct total and per-person amounts to 2 decimal places, correct rounding, and results that update on input. Full credit when all calculation checks pass; part credit when the main example passes but rounding or live updating fails.",
      },
      {
        id: "errors",
        label: "Handles bad input clearly",
        weight: 2,
        guidance:
          "Full credit when the error checks pass (people below 1, empty or negative bill) and the message tells the user what to fix rather than showing NaN, Infinity or a blank result. Part credit when errors are caught but the message is vague or does not clear once the input is fixed.",
      },
      {
        id: "process",
        label: "Worked in small, checked steps with the AI",
        weight: 3,
        guidance:
          "Graded from the build log. Full credit when the log shows at least three distinct small steps, says what was run or checked after each, and describes at least one specific AI change that was rejected or corrected with a reason (for example it added features not asked for, changed unrelated code, or got the rounding wrong). Part credit for steps with no checks, or a vague 'the AI made a mistake'. Low credit for 'I asked the AI to build it and it worked'.",
      },
      {
        id: "readable",
        label: "Code a beginner can read and explain",
        weight: 1,
        guidance:
          "Full credit for clear names, one small calculation function, no dead or unused code left from rejected AI suggestions, and nothing beyond what the brief asks for. Part credit for working code with confusing names or leftover experiments.",
      },
    ],
    config: {
      kind: "code",
      maxRuns: 12,
      starterCode: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bill splitter</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 2rem auto; padding: 0 1rem; }
  </style>
</head>
<body>
  <h1>Bill splitter</h1>

  <!--
    Required ids:
      #bill    number input: the bill amount
      #tip     number input: tip percentage (10 means 10%)
      #people  number input: how many people
      #total   total including tip, 2 decimal places
      #each    amount per person, 2 decimal places
      #error   message shown when bill is empty or negative, or people < 1
    Results update on the "input" event. Build it one small step at a time.
  -->

</body>
</html>
`,
      assistantNotes:
        "The learner is practising working in small steps. Make only the change they ask for, keep each change small, and do not add features, libraries or styling they did not request. If they ask for the whole app at once, suggest splitting it into steps and offer the first one. Explain each change in one or two plain sentences so they can check it.",
      checks: [
        {
          id: "main-example",
          label: "Bill 100, tip 10%, 4 people gives 110.00 total and 27.50 each",
          code:
            H_BILL +
            `set("bill", "100"); set("tip", "10"); set("people", "4");
await wait();
const t = $("total").textContent, e = $("each").textContent;
if (!t.includes("110.00")) return "Expected #total to contain 110.00, got: " + t.trim();
if (!e.includes("27.50")) return "Expected #each to contain 27.50, got: " + e.trim();
return true;`,
          hint: "Total is bill plus bill times tip divided by 100. Show both results with toFixed(2).",
        },
        {
          id: "rounding",
          label: "Rounds to 2 decimals: bill 10, tip 15%, 3 people gives 3.83 each",
          code:
            H_BILL +
            `set("bill", "10"); set("tip", "15"); set("people", "3");
await wait();
const t = $("total").textContent, e = $("each").textContent;
if (!t.includes("11.50")) return "Expected #total to contain 11.50, got: " + t.trim();
if (!e.includes("3.83")) return "Expected #each to contain 3.83, got: " + e.trim();
if (e.includes("3.833")) return "#each shows more than 2 decimal places: " + e.trim();
return true;`,
          hint: "11.50 split three ways is 3.8333... Format the per-person amount to exactly 2 decimal places.",
        },
        {
          id: "live-update",
          label: "Updates as soon as one field changes",
          code:
            H_BILL +
            `set("bill", "100"); set("tip", "10"); set("people", "4");
await wait();
set("people", "5");
await wait();
const e = $("each").textContent;
if (!e.includes("22.00")) return "After changing people from 4 to 5, expected #each to contain 22.00, got: " + e.trim();
set("tip", "0");
await wait();
const t = $("total").textContent;
if (!t.includes("100.00")) return "After changing tip to 0, expected #total to contain 100.00, got: " + t.trim();
return true;`,
          hint: "Listen for the input event on every input, not only on one of them, and recalculate each time.",
        },
        {
          id: "zero-people",
          label: "Shows an error when people is less than 1",
          code:
            H_BILL +
            `set("bill", "50"); set("tip", "10"); set("people", "0");
await wait();
if (!shown($("error"))) return "With 0 people, #error should show a visible message";
return true;`,
          hint: "Check people before dividing. Dividing by zero gives Infinity, which is not a helpful message.",
        },
        {
          id: "bad-bill",
          label: "Shows an error when the bill is empty or negative",
          code:
            H_BILL +
            `set("bill", ""); set("tip", "10"); set("people", "2");
await wait();
if (!shown($("error"))) return "With an empty bill, #error should show a visible message";
set("bill", "-20");
await wait();
if (!shown($("error"))) return "With a negative bill, #error should show a visible message";
return true;`,
          hint: "An empty number input has the value \"\" (an empty string), not 0. Check for it explicitly.",
        },
        {
          id: "error-clears",
          label: "The error clears when the input is fixed",
          code:
            H_BILL +
            `set("bill", "60"); set("tip", "10"); set("people", "0");
await wait();
set("tip", "0"); set("people", "3");
await wait();
if (shown($("error"))) return "With valid input, #error should be empty or hidden, but it shows: " + $("error").textContent.trim();
const e = $("each").textContent;
if (!e.includes("20.00")) return "Expected #each to contain 20.00 for 60 with no tip between 3, got: " + e.trim();
return true;`,
          hint: "When the inputs are valid, clear the error text (or hide the element) before showing the results.",
        },
      ],
      fields: [
        {
          id: "build-log",
          label: "Build log",
          prompt:
            "List the steps you took, in order. For each, say what you asked the AI (or changed yourself) and what you ran or checked afterwards. Describe at least one change the AI suggested that you rejected or corrected, and why.",
          placeholder:
            "Step 1: asked for the three inputs only. Checked the ids in the preview... Rejected: the AI also added a currency dropdown I had not asked for...",
          minWords: 40,
        },
      ],
    },
  },

  // ── Module 4 ──────────────────────────────────────────────────────────
  {
    slug: "vibe-coding-lab-4-fix-the-bug-then-prove-it",
    title: "Fix the bug, then prove it",
    labType: "code",
    moduleNumber: 4,
    estimatedMinutes: 40,
    points: 70,
    passScore: 70,
    briefMd: `The starter code is a small shopping list app that someone built with AI. It runs, and the demo looked fine. Then real people used it, and these reports came in:

1. *"I removed Eggs from the middle of my list, but Milk disappeared instead."*
2. *"The item count is wrong. I deleted one thing and it still says the old number."*
3. *"If I press Add with nothing typed, or just spaces, I get a blank item on the list."*

Your job is to find the cause of each problem, fix it, and then **prove** the fix. That means reproducing each bug before you change anything, fixing one bug at a time (commit-sized changes), and checking the edge cases around each fix, not only the case in the report. "It runs" is not the same as "it works".

Keep these ids and structure (the automated checks rely on them):

- \`#item\`: the text input for a new item.
- \`#add\`: the button that adds the item.
- \`#list\`: the list. Each item is an \`li\` inside it, with its own remove \`button\` inside the \`li\`.
- \`#count\`: an element showing how many items are on the list.

Items should be stored without leading or trailing spaces. You may ask the AI for help, but check anything it changes: it is common for an AI to "fix" a symptom in a way that breaks something else, or to rewrite more than the bug needs.`,
    scenarioMd: `A good way to work, from Modules 3 and 4:

1. **Reproduce**: make the bug happen on purpose and write down the exact steps.
2. **Isolate**: find the lines responsible. Read them before asking the AI.
3. **Fix**: change as little as possible. Run the app.
4. **Explain**: say in one sentence why the fix works.
5. **Prove**: check the reported case and the edge cases around it (first item, last item, only item, empty list).

Then run the automated checks. They cover the correct behaviour, not the specific fix, so there is more than one right answer.`,
    objectives: [
      {
        id: "fixed",
        label: "All three bugs fixed without breaking what worked",
        weight: 3,
        guidance:
          "Graded mainly from the automated checks: the right item is removed, the count is correct after adding and removing, and empty or whitespace-only items are rejected, while adding normal items still works. Full credit when all checks pass; part credit per bug fixed.",
      },
      {
        id: "diagnosis",
        label: "Each bug reproduced and its cause explained",
        weight: 3,
        guidance:
          "Graded from the bug report. Full credit when, for each of the three bugs, the learner gives the steps to reproduce it, the actual cause in the code (the count updated before the item is removed; the remove handler deletes the first item rather than its own; the add check never rejects empty or blank text), and the fix in a sentence. Part credit if causes are described only as symptoms ('the count was wrong').",
      },
      {
        id: "tests",
        label: "A test plan that covers the edges",
        weight: 2,
        guidance:
          "Full credit for a test plan listing at least six specific checks with expected results, including edge cases such as removing the first, middle and last item, removing the only item, adding after removing, empty input, spaces only, and text with spaces around it. Part credit for only the three reported cases. Low credit for 'I tested it and it works'.",
      },
      {
        id: "ai-review",
        label: "Reviewed and controlled the AI's changes",
        weight: 2,
        guidance:
          "Graded from the bug report. Full credit when the learner says for each fix whether it came from them or the AI, what they checked in the AI's change before accepting it, and names at least one AI suggestion they rejected, narrowed or corrected (for example a rewrite of the whole script, or a fix to the symptom only). Part credit if AI use is mentioned without any review. None if there is no mention of how the fixes were made.",
      },
    ],
    config: {
      kind: "code",
      maxRuns: 10,
      starterCode: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Shopping list</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 2rem auto; padding: 0 1rem; }
    li { display: flex; justify-content: space-between; padding: 0.25rem 0; }
  </style>
</head>
<body>
  <h1>Shopping list</h1>
  <input id="item" placeholder="Add an item">
  <button id="add">Add</button>
  <p>Items: <span id="count">0</span></p>
  <ul id="list"></ul>

  <script>
    const input = document.getElementById("item");
    const list = document.getElementById("list");
    const countEl = document.getElementById("count");

    function updateCount() {
      countEl.textContent = list.children.length;
    }

    function addItem() {
      const text = input.value;
      if (text === null) return;

      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = text;

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        updateCount();
        list.removeChild(list.firstElementChild);
      });

      li.appendChild(label);
      li.appendChild(remove);
      list.appendChild(li);
      input.value = "";
      updateCount();
    }

    document.getElementById("add").addEventListener("click", addItem);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") addItem();
    });
  </script>
</body>
</html>
`,
      assistantNotes:
        "The learner is debugging planted bugs. Do not reveal or fix all the bugs at once. Help them reproduce and isolate one bug at a time, ask what they have observed, and when they ask for a fix, change only the lines needed and explain why it works. Never rewrite the whole script.",
      checks: [
        {
          id: "adds-items",
          label: "Adding items shows them on the list with the right count",
          code:
            H_LIST +
            `await add("Milk"); await add("Eggs"); await add("Bread");
const li = items();
if (li.length !== 3) return "Expected 3 items after adding three, found " + li.length;
if (!li[0].textContent.includes("Milk") || !li[2].textContent.includes("Bread")) return "Items are not shown in the order they were added";
if (count() !== 3) return "Expected #count to show 3, it shows: " + $("count").textContent.trim();
return true;`,
        },
        {
          id: "removes-right-item",
          label: "Remove deletes the item it belongs to",
          code:
            H_LIST +
            `await add("Milk"); await add("Eggs"); await add("Bread");
const eggs = items().find((li) => li.textContent.includes("Eggs"));
if (!eggs) return "Could not find the Eggs item";
if (!(await removeItem(eggs))) return "The Eggs item has no remove button";
const text = items().map((li) => li.textContent).join(" ");
if (items().length !== 2) return "Expected 2 items after removing one, found " + items().length;
if (text.includes("Eggs")) return "Eggs is still on the list after removing it";
if (!text.includes("Milk") || !text.includes("Bread")) return "Removing Eggs also removed a different item";
return true;`,
          hint: "Look at which element the remove handler actually deletes. Each button should remove its own li.",
        },
        {
          id: "count-after-remove",
          label: "The count is correct after removing items",
          code:
            H_LIST +
            `await add("A"); await add("B"); await add("C");
await removeItem(items()[1]);
if (count() !== 2) return "After removing 1 of 3 items, expected #count to show 2, it shows: " + $("count").textContent.trim();
await removeItem(items()[items().length - 1]);
await removeItem(items()[0]);
if (items().length !== 0) return "Expected an empty list after removing every item";
if (count() !== 0) return "After removing every item, expected #count to show 0, it shows: " + $("count").textContent.trim();
return true;`,
          hint: "Check the order of the lines in the remove handler. When is the count read?",
        },
        {
          id: "rejects-empty",
          label: "An empty item is not added",
          code:
            H_LIST +
            `await add("Tea");
await add("");
if (items().length !== 1) return "Pressing Add with nothing typed added an item (" + items().length + " items on the list)";
if (count() !== 1) return "Expected #count to stay at 1, it shows: " + $("count").textContent.trim();
return true;`,
          hint: "An empty input's value is an empty string, never null.",
        },
        {
          id: "rejects-blank",
          label: "An item of only spaces is not added",
          code:
            H_LIST +
            `await add("Tea");
await add("     ");
if (items().length !== 1) return "An item of only spaces was added (" + items().length + " items on the list)";
if (count() !== 1) return "Expected #count to stay at 1, it shows: " + $("count").textContent.trim();
await add("  Jam  ");
if (items().length !== 2) return "A normal item with spaces around it should still be added";
return true;`,
          hint: "Trim the text before checking whether it is empty, and store the trimmed version.",
        },
      ],
      fields: [
        {
          id: "bug-report",
          label: "Bug report",
          prompt:
            "For each of the three bugs: the steps to reproduce it, the cause in the code, and the fix in one sentence. Say whether each fix came from you or the AI, what you checked before accepting it, and any AI suggestion you rejected or narrowed.",
          minWords: 80,
        },
        {
          id: "test-plan",
          label: "Test plan",
          prompt:
            "List the checks you ran to prove the fixes, each with its expected result. Include edge cases, not only the three reported problems (for example the first, middle, last and only item, and adding after removing).",
          minWords: 50,
        },
      ],
    },
  },

  // ── Module 5 ──────────────────────────────────────────────────────────
  {
    slug: "vibe-coding-lab-5-security-review",
    title: "Security review of an AI answer",
    labType: "critique",
    moduleNumber: 5,
    estimatedMinutes: 30,
    points: 60,
    passScore: 70,
    briefMd: `A bakery owner asked an AI assistant how to build a small website with a contact form, a database and an admin page, securely. The assistant answered confidently, with code. The owner is about to follow it step by step.

Review the answer as Module 5 taught: look for secrets in the wrong place, user input treated as code, unverified dependencies, personal data leaking into logs, and "fixes" that switch off a protection. Select every statement that would make the site unsafe.

Some of the advice is genuinely good. Leave that alone. A reviewer who flags everything is as unhelpful as one who flags nothing, and it is scored that way.`,
    scenarioMd: `Read the whole answer before selecting anything. Then go through it section by section and ask of each piece of advice: *what could a stranger on the internet do if I followed this?*

The bakery, the service names and the package name are fictional and exist only for this exercise.`,
    objectives: [
      {
        id: "recall",
        label: "Caught the security flaws",
        weight: 3,
        guidance:
          "Credit for each planted flaw correctly selected: the API key in front-end code, SQL built by joining strings, messages rendered with innerHTML, the unverified package installed on trust, full request bodies including passwords logged, and certificate checking switched off.",
      },
      {
        id: "subtle",
        label: "Caught the flaws that look like helpful advice",
        weight: 2,
        guidance:
          "Extra credit for the three flaws that read as sensible convenience: keeping formatting with innerHTML, installing a plausible-sounding package with no checks, and the one-line setting that makes a certificate error 'go away'.",
      },
      {
        id: "precision",
        label: "Left the sound advice alone",
        weight: 2,
        guidance:
          "Credit for not selecting the correct advice: the database password in a server environment variable, the .env file in .gitignore, validating on the server as well as the browser, using an established login provider, checking admin rights on the server, and serving the site over HTTPS.",
      },
    ],
    config: {
      kind: "critique",
      answerMd: `### The question

*I'm building a small website for my bakery. It has a contact form (name, email, message) that saves each message to a database and emails me, plus an admin page where I log in to read the messages. How do I set it up securely?*

---

### The AI's answer

Great project! Here is a secure, production-ready setup you can copy.

**1. Sending the email.** Sign up with an email-sending service and put your email API key straight into script.js so the form can send the email directly from the browser. It is only used for sending email, so it is safe to expose.

\`\`\`js
const MAIL_API_KEY = "sk_live_9f2c7a1e4b";
\`\`\`

**2. Saving the message.** On your Node.js server, build the query by joining the values into the SQL string. This is the simplest approach and works with any database.

\`\`\`js
const sql = "INSERT INTO messages (name, email, message) VALUES ('" + name + "', '" + email + "', '" + message + "')";
db.query(sql);
\`\`\`

Keep your database password in an environment variable on the server, and add your .env file to .gitignore so it never reaches your repository.

**3. Showing messages on the admin page.** Loop over the messages and set innerHTML so any formatting they typed is kept.

\`\`\`js
row.innerHTML = msg.name + ": " + msg.message;
\`\`\`

**4. Validation.** Check the email format in the browser for quick feedback, and check it again on the server, because anything sent from a browser can be changed.

**5. Stopping spam.** Install the express-contact-shield package, which blocks bots and cleans every field automatically. Just run npm install express-contact-shield and add it to your server; no further checks are needed.

**6. Admin login.** Use an established authentication provider for the admin login rather than writing your own password handling, and check on the server that the logged-in user is an admin before returning any messages.

**7. Debugging.** While you get things working, log every request body in full, including the password field, so you can see exactly why a sign-in fails.

\`\`\`js
app.use((req, res, next) => { console.log("Incoming", req.body); next(); });
\`\`\`

**8. Certificate errors.** If you see an error like "unable to verify the first certificate" when calling the email service, set NODE_TLS_REJECT_UNAUTHORIZED to 0 and the error will go away.

Finally, serve the whole site over HTTPS, which most hosts can set up for free. Follow these steps and your site will be secure.`,
      flaws: [
        {
          id: "f1",
          quote: "put your email API key straight into script.js",
          explanation:
            "Anything in front-end JavaScript is visible to every visitor through the browser's developer tools. Anyone could copy the key and send email (or spam) on your account and at your cost. Keys belong in environment variables on the server, and the browser should call your server, which calls the email service.",
          category: "privacy",
        },
        {
          id: "f2",
          quote: "build the query by joining the values into the SQL string",
          explanation:
            "This is SQL injection waiting to happen. A message containing a quote mark and some SQL can change what the query does, for example reading or deleting other data. Use a parameterised query (placeholders with the values passed separately) so input is never treated as SQL.",
          category: "logic",
        },
        {
          id: "f3",
          quote: "set innerHTML so any formatting they typed is kept",
          explanation:
            "Rendering user input with innerHTML lets anyone who submits the form put HTML and script into your admin page (cross-site scripting). It would run with your logged-in admin session. Use textContent so the message is shown as text.",
          category: "logic",
        },
        {
          id: "f4",
          quote: "Install the express-contact-shield package",
          explanation:
            "The package name is invented for this exercise, and that is the point: AI tools sometimes recommend packages that do not exist, and attackers register those names with malicious code ('slopsquatting'). Check that a package exists, who maintains it, how widely it is used and when it was last updated before installing, and never accept 'no further checks are needed'.",
          category: "fabrication",
        },
        {
          id: "f5",
          quote: "log every request body in full, including the password field",
          explanation:
            "Logs are copied, kept and read by more people and tools than your database. Logging full request bodies writes passwords and personal data (names, emails, messages) into them. Log what happened and an id, never secrets or personal data.",
          category: "privacy",
        },
        {
          id: "f6",
          quote: "set NODE_TLS_REJECT_UNAUTHORIZED to 0",
          explanation:
            "This switches off certificate checking for every outgoing connection, so the app can no longer tell whether it is talking to the real email service or an impostor. It hides the error instead of fixing it. Find the real cause (often a proxy, missing certificate or wrong address) and fix that.",
          category: "overconfidence",
        },
      ],
      candidates: [
        { id: "c1", text: "Putting the email API key in script.js because it is only used for email", isFlaw: true, flawId: "f1" },
        { id: "c2", text: "Keeping the database password in an environment variable on the server", isFlaw: false },
        { id: "c3", text: "Building the SQL insert by joining the form values into the query string", isFlaw: true, flawId: "f2" },
        { id: "c4", text: "Adding the .env file to .gitignore so it never reaches the repository", isFlaw: false },
        { id: "c5", text: "Showing messages on the admin page with innerHTML to keep formatting", isFlaw: true, flawId: "f3" },
        { id: "c6", text: "Checking the email format in the browser and again on the server", isFlaw: false },
        { id: "c7", text: "Installing express-contact-shield and treating it as enough spam protection", isFlaw: true, flawId: "f4" },
        { id: "c8", text: "Using an established authentication provider for the admin login", isFlaw: false },
        { id: "c9", text: "Checking on the server that the user is an admin before returning messages", isFlaw: false },
        { id: "c10", text: "Logging every request body in full, including the password field", isFlaw: true, flawId: "f5" },
        { id: "c11", text: "Setting NODE_TLS_REJECT_UNAUTHORIZED to 0 to clear a certificate error", isFlaw: true, flawId: "f6" },
        { id: "c12", text: "Serving the whole site over HTTPS", isFlaw: false },
      ],
    },
  },

  // ── Module 6 ──────────────────────────────────────────────────────────
  {
    slug: "vibe-coding-lab-6-harden-and-ship",
    title: "Harden it and get it ready to ship",
    labType: "code",
    moduleNumber: 6,
    estimatedMinutes: 50,
    points: 80,
    passScore: 70,
    briefMd: `The starter code is a feedback form for a workshop. It works in a demo: you type a name, an email and a comment, press Submit, and the comment appears in the list. It is not ready to ship. It trusts every input, it renders what people type as HTML, and it has a live API key sitting in the page.

Harden it, then write the notes you would need to ship it. Work in small steps and check each one, as in the earlier labs.

Keep these ids (the automated checks rely on them):

- \`#name\`, \`#email\`, \`#comment\`: the inputs (the comment may be a textarea).
- \`#submit\`: the button that submits.
- \`#list\`: where submitted comments appear.
- \`#error\`: a message element that explains what to fix when a submission is rejected.

The hardened page must:

1. Show whatever people type **as text**, never as HTML. A comment of \`<b>hi</b>\` must appear literally, angle brackets and all.
2. Reject an email that is not a valid address, a comment that is empty or only spaces, and a comment over 500 characters. A rejected submission adds nothing to the list and shows a message in \`#error\`. A comment of exactly 500 characters is allowed.
3. Contain **no API key** anywhere in the page. In a real app the call that needs the key would move to the server, with the key in an environment variable. Here, remove the key and the code that uses it, and describe the server-side version in your ship checklist.

Validation in the browser is for the user's convenience. Say in your notes what the server would also have to check.`,
    scenarioMd: `Before you start, find each problem in the starter code yourself and write it down. Then fix one at a time: run the page, try the bad input, and confirm it is handled before moving on.

For the ship checklist, imagine the form will be used by around a hundred workshop attendees and run by one person who is not a developer. Be specific: name where it would run, which settings go in environment variables, what you would log and what you never would, and exactly how you would undo a bad release.`,
    objectives: [
      {
        id: "hardened",
        label: "Input handled safely and validated",
        weight: 3,
        guidance:
          "Graded mainly from the automated checks: comments and names shown as text (no HTML created from input), invalid email, empty comment and over-long comment rejected with a visible message and nothing added, valid submissions (including exactly 500 characters) accepted. Full credit when all pass; part credit per check.",
      },
      {
        id: "secret",
        label: "Secret removed and handled the right way",
        weight: 2,
        guidance:
          "Full credit when no key remains anywhere in the page (including comments) and the notes explain that the call moves to a server, the key lives in an environment variable on the host, and the exposed key must be rotated because it was already published. Part credit if the key is removed but rotation or the server side is not mentioned.",
      },
      {
        id: "ship",
        label: "A ship checklist someone could follow",
        weight: 3,
        guidance:
          "Full credit for a checklist naming where the app will run (and a separate test environment), the environment variables it needs, what will be logged (events, errors, ids) and what never will (secrets, passwords, email addresses, comment text), how problems will be noticed (monitoring or alerts), server-side validation that mirrors the browser checks, and step-by-step rollback to the last working version. Part credit if rollback or logging is missing or vague.",
      },
      {
        id: "ai-review",
        label: "Reviewed the AI's changes before accepting them",
        weight: 2,
        guidance:
          "Graded from the review field. Full credit when the learner lists what the AI changed, what they checked in each change, and at least one AI change they rejected or corrected (for example swapping innerHTML for another unsafe method, a weak email check, or a key moved to another variable instead of removed). Part credit for a list of changes with no checking. None if the field is empty or says only that the AI did it.",
      },
    ],
    config: {
      kind: "code",
      maxRuns: 14,
      starterCode: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Workshop feedback</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 2rem auto; padding: 0 1rem; }
    label { display: block; margin-top: 0.75rem; }
    input, textarea { width: 100%; box-sizing: border-box; }
    #error { color: #b00020; }
  </style>
</head>
<body>
  <h1>Workshop feedback</h1>
  <label>Name <input id="name"></label>
  <label>Email <input id="email"></label>
  <label>Comment <textarea id="comment" rows="4"></textarea></label>
  <button id="submit" type="button">Submit</button>
  <p id="error"></p>
  <h2>Comments</h2>
  <ul id="list"></ul>

  <script>
    const ANALYTICS_API_KEY = "sk-live-7d1f93b2c4e8a605";

    function trackSubmission(entry) {
      // Would send the entry to the analytics service with the key.
      return { url: "https://analytics.example.com/track", auth: "Bearer " + ANALYTICS_API_KEY, body: entry };
    }

    document.getElementById("submit").addEventListener("click", function () {
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const comment = document.getElementById("comment").value;

      document.getElementById("list").innerHTML +=
        "<li><strong>" + name + "</strong>: " + comment + "</li>";

      trackSubmission({ name: name, email: email, comment: comment });
      document.getElementById("comment").value = "";
    });
  </script>
</body>
</html>
`,
      assistantNotes:
        "The learner is hardening an unsafe page. Help one problem at a time and explain the risk in plain words. Prefer textContent and createElement over innerHTML. Do not move the API key into another variable or a comment: it must be removed from the page, and the notes should describe a server-side call. Do not add libraries.",
      checks: [
        {
          id: "valid-submission",
          label: "A valid submission appears in the list",
          code:
            H_FORM +
            `await submit("Ada", "ada@example.com", "Great workshop, thank you");
if (!$("list").textContent.includes("Great workshop, thank you")) return "A valid comment did not appear in #list";
return true;`,
        },
        {
          id: "shows-as-text",
          label: "Input is shown as text, not HTML",
          code:
            H_FORM +
            `await submit("Ada", "ada@example.com", "<b>hi</b>");
const list = $("list");
if (list.querySelector("b")) return "A <b> element was created from the comment, so input is being treated as HTML";
if (!list.textContent.includes("<b>hi</b>")) return "The comment <b>hi</b> should appear literally in #list";
return true;`,
          hint: "Create the list item with createElement and set its textContent, rather than building an HTML string.",
        },
        {
          id: "invalid-email",
          label: "An invalid email is rejected with a message",
          code:
            H_FORM +
            `const before = snap();
await submit("Ben", "not-an-email", "Hello from Ben");
if (snap() !== before) return "A submission with an invalid email was added to #list";
if (!$("error").textContent.trim() || !shown($("error"))) return "An invalid email should show a message in #error";
return true;`,
          hint: "Check the email before adding anything, and stop (return) if it is not valid.",
        },
        {
          id: "empty-comment",
          label: "An empty or blank comment is rejected",
          code:
            H_FORM +
            `const before = snap();
await submit("Cy", "cy@example.com", "");
if (snap() !== before) return "An empty comment was added to #list";
if (!shown($("error"))) return "An empty comment should show a message in #error";
await submit("Cy", "cy@example.com", "     ");
if (snap() !== before) return "A comment of only spaces was added to #list";
return true;`,
          hint: "Trim the comment before checking whether it is empty.",
        },
        {
          id: "length-limit",
          label: "Comments over 500 characters are rejected; 500 is allowed",
          code:
            H_FORM +
            `const before = snap();
await submit("Di", "di@example.com", "a".repeat(501));
if (snap() !== before) return "A 501-character comment was added to #list";
if (!shown($("error"))) return "A comment over 500 characters should show a message in #error";
await submit("Di", "di@example.com", "b".repeat(500));
if (!$("list").textContent.includes("b".repeat(500))) return "A comment of exactly 500 characters should be accepted";
return true;`,
          hint: "Check the boundary: more than 500 is rejected, 500 exactly is fine.",
        },
        {
          id: "no-secret",
          label: "No API key in the page",
          code:
            `if (doc.documentElement.outerHTML.includes("sk-live")) return "The page still contains an API key (found sk-live in the source, which includes comments)";
return true;`,
          hint: "Remove the key and the code that uses it. Moving it to another variable or a comment still publishes it.",
        },
      ],
      fields: [
        {
          id: "ship-checklist",
          label: "Ship checklist",
          prompt:
            "Where will it run (and where will you test first)? What goes in environment variables? What will you log, and what will you never log? What must the server also validate? How will you notice problems, and exactly how would you roll back a bad release? Include what you would do about the key that was already exposed.",
          minWords: 80,
        },
        {
          id: "ai-review",
          label: "Review of the AI's changes",
          prompt:
            "List the changes the AI proposed, what you checked in each before accepting it, and at least one change you rejected or corrected, and why.",
          minWords: 40,
        },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// FINAL EXAM
// ═══════════════════════════════════════════════════════════════════════════

export const TRACK_4_FINAL_EXAM: SeedFinalExam = {
  title: "Vibe Coding Like a Software Engineer: Final Exam",
  timeLimitMinutes: 60,
  questionsServed: 35,
  passScore: 75,
  distinctionScore: 90,
  maxAttempts: 3,
  cooldownHours: 24,
  instructionsMd: `## Before you start

**35 questions. 60 minutes. 75% to pass.** Score 90% or above and your certificate is marked *with Distinction*.

Most questions are short scenarios from building software with AI: a spec that cannot be checked, a diff that changes too much, a test that passes for the wrong reason, a key in the wrong place, a deploy that goes wrong. They test the judgement of a working software engineer. Recalling a phrase from a lesson will not be enough.

Questions are drawn at random from a larger bank covering all six modules, and the options are shuffled, so each attempt is different. Every answer is saved the moment you select it, and the clock runs on our server.

You have up to 3 attempts, with a 24-hour gap between them so that a retry is a studied one. Your result is broken down by module, so you will know what to revisit.`,
  questions: [
    // ── Module 1: Vibe Coding, Engineered ────────────────────────────────
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "In this course, what does 'vibe coding' mean?",
      options: [
        "Writing code by hand while keeping a relaxed state of creative flow",
        "Describing what you want in plain language and letting AI write the code",
        "Using a drag-and-drop builder that never produces any code at all",
        "Copying code from online forums and tweaking it until the errors disappear",
      ],
      correctIndex: 1,
      explanation:
        "Vibe coding is building software by describing what you want and letting AI write the code. The course keeps that speed but adds the engineering habits that stop it breaking in real use.",
    },
    {
      moduleNumber: 1,
      difficulty: 1,
      question: "What most distinguishes a coding agent from a chat assistant?",
      options: [
        "It only explains code and never writes or changes any of it",
        "It is a hosted website builder that also deploys your app",
        "It can read your project, edit several files and run commands",
        "It checks the spelling and grammar in code comments and in docs",
      ],
      correctIndex: 2,
      explanation:
        "A coding agent works inside your project: it reads files, makes multi-file edits and runs commands. That power is why its changes need the most careful review; a chat assistant only suggests code you paste in.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A founder builds a booking app in a weekend with an app builder. The demo works. Before inviting 200 real customers, what is the biggest gap?",
      options: [
        "The code was written by AI, so it cannot be trusted in production",
        "The colours and fonts have not yet been tested on enough customers",
        "App builders cannot cope with more than a few users at the same time",
        "Nobody has decided where data lives, who maintains it or how it fails",
      ],
      correctIndex: 3,
      explanation:
        "Code is the smallest part of the system. Real customers bring real data, outages and support needs, so storage, ownership and failure handling matter more than whether AI wrote the code.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "On a page you built, a button looks right but nothing happens when you click it. Where do you look first?",
      options: [
        "The JavaScript, which controls what happens when someone clicks",
        "The CSS, which decides what the button does when it is pressed",
        "The HTML title tag, which tells the browser which script to run",
        "The database, which has to store the click before it is handled",
      ],
      correctIndex: 0,
      explanation:
        "HTML gives the page its structure, CSS its appearance and JavaScript its behaviour. A button that looks right but does nothing points to missing or broken JavaScript, often a wrong id or an error shown in the console.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "An analyst's AI-built dashboard works well for her. Then her whole team starts relying on it every day. What has most increased the risk?",
      options: [
        "The dashboard now shows more charts than one person can read",
        "Others depend on it now, but no one owns fixing it when it breaks",
        "The team will want new features faster than the AI can add them",
        "The code has grown too long to be pasted into one AI prompt",
      ],
      correctIndex: 1,
      explanation:
        "The same code became part of other people's work. Once others depend on it, someone has to own it, notice failures and fix them; a personal tool with no owner becomes a hidden single point of failure.",
    },
    {
      moduleNumber: 1,
      difficulty: 2,
      question:
        "A marketer needs a one-off landing page with a sign-up form, live this week, with no custom logic. Which tool category fits best?",
      options: [
        "A coding agent working across a large existing codebase",
        "A custom back end with its own database and login system",
        "A chat assistant pasting code into a file with no hosting",
        "An app builder that hosts the page and handles the form",
      ],
      correctIndex: 3,
      explanation:
        "Match the tool to the job. A simple hosted page with a form is exactly what app builders do well; a custom back end or coding agent adds work and moving parts that this job does not need.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question:
        "Each quick AI fix breaks something else, so the team asks for another quick fix, and the code grows harder to understand. What is this?",
      options: [
        "A balancing loop that will settle the code into a stable state",
        "A one-off event with no link to how the work is being organised",
        "A reinforcing loop: each quick fix makes the next failure likelier",
        "A delay that will disappear once the team stops using AI tools",
      ],
      correctIndex: 2,
      explanation:
        "The loop feeds itself: fixes add confusion, confusion causes failures, failures prompt more fixes. That is reinforcing. It is a structure, not a one-off event, so changing the process (small checked steps) is what breaks it.",
    },
    {
      moduleNumber: 1,
      difficulty: 3,
      question: "When is vibe coding with no engineering practices a reasonable choice?",
      options: [
        "A throwaway prototype only you will use, with no real or personal data",
        "A customer-facing app, provided the AI confirms that the code is secure",
        "Any project at all, as long as it is small and finished within a week",
        "An internal tool holding staff records, if only managers can log in",
      ],
      correctIndex: 0,
      explanation:
        "Risk comes from who depends on it and what data it touches, not from size or speed. A throwaway personal prototype with no real data can afford shortcuts; anything with users or personal data cannot, whatever the AI says.",
    },

    // ── Module 2: Specs Before Prompts ───────────────────────────────────
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "Which of these is an acceptance criterion in Given/When/Then form?",
      options: [
        "As a shopper, I want a cart so that I can buy several books at once",
        "The cart should be fast, intuitive and pleasant for every shopper",
        "Given an empty cart, when I add a book, then the cart shows 1 item",
        "Build the cart with React and keep it in the browser's local storage",
      ],
      correctIndex: 2,
      explanation:
        "Given/When/Then names a starting state, an action and an observable result anyone can check. The first option is a user story, the second is untestable and the fourth is an implementation choice.",
    },
    {
      moduleNumber: 2,
      difficulty: 1,
      question: "What is a non-goal in a spec?",
      options: [
        "A feature you hope to add if the AI finishes the build early",
        "A requirement that failed its acceptance test and was then dropped",
        "A need users have that the product cannot help them with",
        "Something you have decided this version will deliberately not do",
      ],
      correctIndex: 3,
      explanation:
        "Non-goals draw the boundary of the version. Writing them down stops the AI (and you) filling gaps with extra features, which is one of the most common sources of scope creep.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "You are building a recipe app. Which is the best first step to ask the AI for?",
      options: [
        "Design the full database schema for recipes, users and ratings",
        "Add one recipe through a form and see it listed on the page",
        "Build the layout of every screen, then connect them to data",
        "Write login, sharing and ratings together in a single prompt",
      ],
      correctIndex: 1,
      explanation:
        "A vertical slice goes end to end through one thing a user can do, so you can run it and check it straight away. Building layers or everything at once gives you nothing you can verify until much later.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "A spec says 'the app should be user-friendly and fast'. What is the main problem?",
      options: [
        "Neither can be checked, so no one can say when it is done",
        "It is too specific and will limit what the AI can build",
        "It needs to say which colours make an app feel friendly",
        "It should say 'must' so the AI treats it as a firm rule",
      ],
      correctIndex: 0,
      explanation:
        "A requirement you cannot check cannot guide the build or tell you when you are finished. Rewrite it as something observable, such as 'the list loads in under a second with 500 items'.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "Which addition to the prompt 'Build me a habit tracker' will most improve what the AI builds?",
      options: [
        "A request to follow best practices and make it production ready",
        "A note that the app matters a lot and must be done very carefully",
        "The stack, three user stories with criteria and what to leave out",
        "Permission for the AI to choose whatever stack and features it likes",
      ],
      correctIndex: 2,
      explanation:
        "An AI builds from what you give it. Stack, stories with acceptance criteria and non-goals remove the guesses; 'best practices' and 'be careful' add no information, and full freedom invites features you did not want.",
    },
    {
      moduleNumber: 2,
      difficulty: 2,
      question: "For a simple event sign-up app, which data model is the most sensible start?",
      options: [
        "One table per event, created automatically each time an event is added",
        "A single text file where each new sign-up is added as a sentence",
        "Users, roles, permissions, audit logs and events from the very start",
        "Events and sign-ups, with each sign-up linked to one event by its id",
      ],
      correctIndex: 3,
      explanation:
        "Start with the fewest things that model the problem and link them clearly. Two linked tables cover the core; a table per event is unmanageable, a text file cannot be queried and the large model is built for needs you do not have.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question:
        "The AI returns a working app that also adds user accounts and payments you did not ask for. What does good practice suggest?",
      options: [
        "Keep them, since extra features cost nothing once they are written",
        "Reject the extras and rebuild to the spec's scope, one step at a time",
        "Keep payments but remove accounts, since payments earn money sooner",
        "Ask the AI to write tests for the extras so that they are safe to keep",
      ],
      correctIndex: 1,
      explanation:
        "Unrequested features are code you must now understand, secure and maintain, and accounts and payments carry real risk. Keeping to the spec and small steps keeps every change checkable.",
    },
    {
      moduleNumber: 2,
      difficulty: 3,
      question: "Which definition of done is strongest for the first release of an expense form?",
      options: [
        "The AI has confirmed that the code is complete and has no known bugs",
        "The form looks finished and the founder is happy with the design",
        "All acceptance criteria and edge cases pass, committed and deployed",
        "Every idea on the feature wish list has been built and demonstrated",
      ],
      correctIndex: 2,
      explanation:
        "Done should be verifiable by someone other than the builder: criteria and edge cases checked, work committed and running where users will use it. The AI's confidence and a nice look are not evidence.",
    },

    // ── Module 3: Building in Small Loops ────────────────────────────────
    {
      moduleNumber: 3,
      difficulty: 1,
      question: "Why commit your work before asking the AI for a change?",
      options: [
        "So you can go back to the last working version if the change breaks it",
        "So the AI can read your commit history and write better code as a result",
        "Because Git will refuse any AI change made on top of uncommitted work",
        "So the change is deployed to your live website as soon as it is made",
      ],
      correctIndex: 0,
      explanation:
        "A commit is a save point. If the AI's change breaks things, you can see exactly what changed and return to the version that worked in seconds, instead of untangling it by hand.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question: "You ask the AI to fix a typo in a heading. The diff changes 14 files. What do you do?",
      options: [
        "Accept it, since the AI has probably improved other things at the same time",
        "Accept and commit it, then look through the other files later when you can",
        "Ask the AI whether the other changes were needed and go with its answer",
        "Reject it, return to your last commit and ask again with a narrower scope",
      ],
      correctIndex: 3,
      explanation:
        "A change far bigger than the request is a warning sign: you cannot review it and it may break unrelated things. Reject it, reset to the last commit and ask for exactly the one change.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "The console shows \"TypeError: Cannot read properties of undefined (reading 'price')\". What does it most likely mean?",
      options: [
        "The price is a number and has to be converted into text first",
        "The code tried to read price from something that does not exist",
        "The browser could not reach the server that stores all the prices",
        "The price field is missing from the page's CSS stylesheet file",
      ],
      correctIndex: 1,
      explanation:
        "The error says the object before '.price' is undefined: perhaps a product that was not found or data that has not loaded yet. The line number in the console tells you where to start looking.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "A feature worked on Monday and is broken on Thursday, after nine small commits. What is the most efficient approach?",
      options: [
        "Paste the whole codebase into the AI and ask it to find the fault",
        "Delete the feature and ask the AI to write it again from scratch",
        "Use the commit history to find the first commit where it breaks",
        "Keep adding fixes until the feature appears to be working again",
      ],
      correctIndex: 2,
      explanation:
        "Small commits make this cheap: check out commits between Monday and Thursday until you find the first broken one, then read that small diff. Rewriting or piling on fixes throws that evidence away.",
    },
    {
      moduleNumber: 3,
      difficulty: 2,
      question:
        "You want to try a risky redesign the AI suggested without disturbing the working code. Which Git feature fits?",
      options: [
        "A branch, so the redesign lives apart from main until it proves itself",
        "A revert, so the redesign replaces main and can be undone at any time",
        "A log entry, so the redesign is recorded as a note on your last commit",
        "A tag, so the AI gets its own labelled copy of every file to work in",
      ],
      correctIndex: 0,
      explanation:
        "A branch keeps the experiment separate. If it works, merge it; if not, switch back to main and delete it. A revert undoes a commit, and the log only shows history.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question: "A user reports that totals are sometimes wrong. What should you do first?",
      options: [
        "Ask the AI to rewrite the total calculation in a cleaner way",
        "Add extra error messages everywhere so the next report is clearer",
        "Explain to the user that rounding errors are normal in software",
        "Reproduce it by finding the exact inputs that give a wrong total",
      ],
      correctIndex: 3,
      explanation:
        "Reproduce, isolate, fix, explain. Until you can make the bug happen on purpose you cannot know whether any change fixed it, and a rewrite may hide it rather than remove it.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "The AI fixed a bug and the app now works, but you cannot explain why the fix works. What is the engineer's move?",
      options: [
        "Commit it straight away, since working code does not need explaining",
        "Undo the fix, because code you cannot explain is always wrong code",
        "Ask it to explain the fix line by line and check that against the code",
        "Ask a second AI tool to confirm the first one's fix is correct",
      ],
      correctIndex: 2,
      explanation:
        "You own every line you ship. Getting an explanation and checking it against the code tells you whether the fix addresses the cause or just hides the symptom, which matters when it breaks again.",
    },
    {
      moduleNumber: 3,
      difficulty: 3,
      question:
        "Over a long session, each prompt adds 'while you're at it' requests. Commits get bigger and a bug appears. What is the underlying cause?",
      options: [
        "The AI tired over the long session and wrote worse code later on",
        "Git cannot track changes well once a file passes a certain size",
        "So many commits were made that the project history got confused",
        "Batch size grew, so each change was harder to check and to undo",
      ],
      correctIndex: 3,
      explanation:
        "Scope creep enlarges each change. Bigger changes are harder to review, hide bugs and are costly to undo. Keeping one change per prompt and per commit keeps each step checkable.",
    },

    // ── Module 4: Testing and Verification ───────────────────────────────
    {
      moduleNumber: 4,
      difficulty: 1,
      question: "What is the difference between code that runs and code that works?",
      options: [
        "Running means it is on a server; working means it works on a phone",
        "Running means no crash; working means it does the right thing for users",
        "Running means it has tests; working means a person has clicked through",
        "There is none: if code runs without errors, it does what it should do",
      ],
      correctIndex: 1,
      explanation:
        "Code can run without errors and still give wrong totals, accept bad input or lose data. Working means it meets the acceptance criteria, including the edge cases.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "An age field must accept 18 to 120. Which set of test inputs checks it best?",
      options: [
        "25, 40 and 65, as typical ages for the app's likely users",
        "18 and 120 only, since those are the two stated limits",
        "17, 18, 120, 121, empty, text and a negative number",
        "Random whole numbers from 18 to 120, run a hundred times",
      ],
      correctIndex: 2,
      explanation:
        "Bugs cluster at boundaries and in bad input. Testing just either side of each limit plus empty, text and negative values finds far more than typical or random valid values.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "The AI wrote tests and they all pass. How do you know they actually test anything?",
      options: [
        "Break the code on purpose and check that the right tests then fail",
        "Count the tests: more than twenty of them usually means good coverage",
        "Ask the AI to confirm that the tests cover every important case",
        "Run the tests several times to make sure they pass every time",
      ],
      correctIndex: 0,
      explanation:
        "A test that cannot fail proves nothing. Deliberately breaking the behaviour it covers and seeing it go red shows the test is really checking that behaviour.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question:
        "You ask the AI to 'make the failing test pass'. The diff changes the test's expected value from 110 to 100. What happened?",
      options: [
        "It found a mistake in the test and corrected it, so all is well now",
        "It improved the test's precision by rounding to a simpler value",
        "It updated the test to match a newer version of the requirement",
        "It changed the test to fit the bug instead of fixing the code",
      ],
      correctIndex: 3,
      explanation:
        "Asked to make a test pass, an AI may weaken or rewrite the test rather than fix the code. Check the expected value against the spec: if 110 is right, the code is wrong and the test change must be rejected.",
    },
    {
      moduleNumber: 4,
      difficulty: 2,
      question: "Reviewing an AI diff, which change deserves the closest look?",
      options: [
        "A renamed variable from 'x' to 'totalPrice' in the display code",
        "A deleted check that rejected negative amounts in payment code",
        "New comments explaining each step of the calculation function",
        "Re-indented lines across the file with no logic changed at all",
      ],
      correctIndex: 1,
      explanation:
        "Removed checks in code that handles money are high-risk and easy to miss, because deletions draw less attention than additions. Renames, comments and formatting rarely change behaviour.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question:
        "All tests pass, but a user finds that splitting a bill between zero people crashes the app. What does this reveal?",
      options: [
        "The test framework is broken and needs replacing with another one",
        "The user did something unreasonable that no app needs to handle",
        "Tests are pointless for small apps, so manual checks are enough",
        "The tests covered the normal cases but not the edges that matter",
      ],
      correctIndex: 3,
      explanation:
        "Passing tests only prove what they test. Zero, empty and negative values are classic edge cases; the fix is to add a test for this case that fails first, then fix the code.",
    },
    {
      moduleNumber: 4,
      difficulty: 3,
      question: "Your AI keeps making tests pass by deleting assertions. What process change fixes this best?",
      options: [
        "Review every test change separately from code changes before accepting",
        "Tell the AI once that it must never touch the tests, and trust the rule",
        "Stop using tests and check each change by clicking through the app",
        "Let the AI write the code and the tests together in one step to save time",
      ],
      correctIndex: 0,
      explanation:
        "Tests are your independent check, so changes to them need their own scrutiny. A one-off instruction may be ignored, and dropping tests removes the safety net altogether.",
    },

    // ── Module 5: Security, Data and Quality ─────────────────────────────
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "Where should the API key for a paid service live in a web app?",
      options: [
        "In the front-end JavaScript, hidden inside a minified bundle",
        "In the Git repository, in a private folder that nobody else can see",
        "In an environment variable on the server, never in browser code",
        "In the HTML as a hidden input so that forms can send it along",
      ],
      correctIndex: 2,
      explanation:
        "Anything sent to the browser can be read by anyone, minified or not, and anything committed stays in Git history. Keys belong in server-side environment variables.",
    },
    {
      moduleNumber: 5,
      difficulty: 1,
      question: "What is 'slopsquatting'?",
      options: [
        "Registering package names that AI tools invent, to spread malware",
        "Filling a project with low-quality AI code until it becomes slow",
        "Copying a rival's AI-built app and publishing it as your own work",
        "Using AI to write fake reviews for an app in an app store listing",
      ],
      correctIndex: 0,
      explanation:
        "AI tools sometimes suggest packages that do not exist. Attackers register those names with malicious code, so anyone who installs the suggestion unchecked runs it. Verify every unfamiliar package first.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question:
        "You notice your API key was committed to a public repository a week ago. You delete it in a new commit. What else must you do?",
      options: [
        "Nothing more, since deleting the file removes the key from the repo",
        "Make the repository private, which removes the exposure completely",
        "Rename the variable holding the key so bots no longer recognise it",
        "Revoke the key and issue a new one, as it remains in the history",
      ],
      correctIndex: 3,
      explanation:
        "The key is still in Git history and may already have been copied, since bots scan public repositories quickly. Only rotating it (revoking the old key and issuing a new one) ends the exposure.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "A comments page shows each comment with element.innerHTML = comment. What is the risk, and the fix?",
      options: [
        "Slow loading; build the whole list as one string before inserting it",
        "Script injection; set textContent so the comment is shown as text",
        "Broken layout; wrap each comment in a div before using innerHTML",
        "Spam; add a character limit so that long comments are cut short",
      ],
      correctIndex: 1,
      explanation:
        "innerHTML turns user input into live HTML, so a comment can carry script that runs for every visitor (cross-site scripting). textContent displays it as plain text.",
    },
    {
      moduleNumber: 5,
      difficulty: 2,
      question: "Your app hides the 'Delete' button from users who are not admins. Is that enough?",
      options: [
        "Yes: users cannot click a button that is not shown on their screen",
        "No: the button should also be greyed out for users who are not admins",
        "No: the server must also check the user's role on every delete request",
        "Yes: as long as the admin page's web address is kept confidential",
      ],
      correctIndex: 2,
      explanation:
        "Anyone can send a request directly without using your interface. Authorisation must be enforced on the server for every request; hiding buttons only improves the user experience.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "An AI writes: query = \"SELECT * FROM users WHERE email = '\" + email + \"'\". What is the best response?",
      options: [
        "Use a parameterised query so the input is never treated as SQL",
        "Check in the browser that the email contains an @ before sending",
        "Escape the quote marks by hand before the email enters the string",
        "Keep it, since this query only reads data and never changes any",
      ],
      correctIndex: 0,
      explanation:
        "Parameterised queries keep data and code separate, which is the reliable fix for SQL injection. Browser checks are bypassed easily, hand-escaping is easy to get wrong and read-only queries can still leak data.",
    },
    {
      moduleNumber: 5,
      difficulty: 3,
      question:
        "For a newsletter sign-up, an AI suggests also storing date of birth, home address and phone number 'in case they are useful later'. What is the engineer's view?",
      options: [
        "Store all of it but encrypt it, so collecting more carries no risk",
        "Store all of it, since data tends to become valuable as a list grows",
        "Ask for it but make the fields optional, so there is no legal issue",
        "Collect only the email you need, as extra personal data adds risk",
      ],
      correctIndex: 3,
      explanation:
        "Data you do not hold cannot leak. Collecting only what the purpose needs reduces harm from a breach and fits data protection principles; encryption and optional fields reduce risk but do not remove it.",
    },

    // ── Module 6: Shipping and Maintaining ───────────────────────────────
    {
      moduleNumber: 6,
      difficulty: 1,
      question: "Why keep separate development and production environments?",
      options: [
        "So the AI can write code faster in a lighter version of the app",
        "So you can test changes without touching real users and real data",
        "Because hosting providers require two copies of every application",
        "So production can run a newer language version than development",
      ],
      correctIndex: 1,
      explanation:
        "A separate environment, with its own configuration and data, lets you try changes safely. Testing in production means your users find the bugs and your real data takes the damage.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "A Friday deploy breaks sign-up for every new user. What is the fastest safe response?",
      options: [
        "Ask the AI for a quick fix and deploy it straight to production",
        "Leave it and post a notice asking users to come back on Monday",
        "Roll back to the last working release, then fix it and redeploy",
        "Delete the production database and restore it from the backup",
      ],
      correctIndex: 2,
      explanation:
        "Rolling back restores service in minutes with a known-good version, and takes the time pressure off the fix. A rushed fix under pressure is how one outage becomes two.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "Which log line is appropriate for a sign-in endpoint?",
      options: [
        "Sign-in failed for ana@example.com with password 'Summer2026'",
        "Full request received; headers, cookies and body attached below",
        "Sign-in attempt recorded along with the user's session token",
        "Sign-in failed for user id 4812: wrong password (attempt 3)",
      ],
      correctIndex: 3,
      explanation:
        "Log what happened and an id you can trace, never passwords, tokens, cookies or personal data. Logs are copied and kept widely, so secrets in them are secrets exposed.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question:
        "An app calls a paid AI API each time a page loads. A bug makes the page reload in a loop overnight. What guards against a huge bill?",
      options: [
        "Spending caps, rate limits and an alert when usage looks unusual",
        "A faster server, so the loop finishes before the costs add up",
        "Caching the page in the browser so that it loads more quickly",
        "Moving to a larger model, so that fewer API calls are needed",
      ],
      correctIndex: 0,
      explanation:
        "Runaway loops happen. Caps and rate limits bound the damage and alerts tell you quickly; speed, caching the page or a bigger model do not stop a loop from calling the API.",
    },
    {
      moduleNumber: 6,
      difficulty: 2,
      question: "You are handing your app to a freelance developer. Which document helps them most?",
      options: [
        "The full transcript of every AI chat used while building the app",
        "A README: how to run it, env vars needed, deploy steps, known issues",
        "A list of every feature idea you had but never got round to building",
        "Screenshots of each page so they can see what it should look like",
      ],
      correctIndex: 1,
      explanation:
        "A README lets someone run, configure and deploy the app without you, and known issues save them rediscovering problems. Chat transcripts are long and mostly out of date.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question:
        "Each rushed AI fix adds messy code, which makes the next change slower and riskier, which leads to more rushed fixes. How do you break this loop?",
      options: [
        "Accept AI fixes without review until the backlog has cleared",
        "Rewrite the whole app in one go with a different AI coding tool",
        "Set aside time to refactor and add tests, paying down the debt",
        "Add features so the product earns enough to hire a team later",
      ],
      correctIndex: 2,
      explanation:
        "Technical debt drives a reinforcing loop. Paying it down on purpose (refactoring with tests as a safety net) weakens the loop; going faster feeds it and a big-bang rewrite trades it for new risk.",
    },
    {
      moduleNumber: 6,
      difficulty: 3,
      question: "Which situation most clearly calls for bringing in a professional software engineer?",
      options: [
        "The app's colours need adjusting to match the company's new branding",
        "A static page needs its opening hours changed for the summer season",
        "You want to add a new question to an internal help page for staff",
        "The app will take payments and store customers' health information",
      ],
      correctIndex: 3,
      explanation:
        "Payments and health data raise the stakes: security, legal duties and the cost of failure all jump. That is when expert review earns its cost; small content and style changes are safe to do yourself.",
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CAPSTONE
// ═══════════════════════════════════════════════════════════════════════════

export const TRACK_4_CAPSTONE: SeedCapstone = {
  passThreshold: 70,
  briefMd: `## The brief

Build and ship a **small, real app with AI, the engineer's way**. This is the practical proof behind the certificate: not that you can get AI to produce code, but that you can turn an idea into software other people can rely on, and that someone else could pick it up after you.

Choose something modest that at least one other real person will use: a sign-up sheet for a club, a booking form for a small business, a tracker for your team, a calculator your customers need. Small and finished beats ambitious and half-built. It must be deployed somewhere another person can use it, even if only a handful of people do.

## What to submit

A link to the running app, a link to (or export of) its Git repository, and one document of roughly **1,500 to 2,500 words** covering these parts.

**1. The system map.** From Module 1: users, data in and out, personal data marked, integrations, where it runs, who maintains it, what happens when it breaks, and at least one feedback loop labelled reinforcing or balancing. Say what the map changed about how you built it.

**2. The spec.** Problem and users, three to six user stories, acceptance criteria in Given/When/Then form (including edge and error cases), non-goals, the stack and a simple data model, and your definition of done.

**3. How you built it.** Your Git history should show small commits, each one change you ran and checked. In the document, pick three commits and explain what you asked the AI, what you checked and what you rejected or corrected. Include one bug you hit and how you reproduced, isolated, fixed and explained it.

**4. Tests and verification.** Automated tests or a written test plan covering every acceptance criterion and at least five edge cases, with results. Show that at least one test fails when the code is broken on purpose.

**5. Security review.** Where secrets live, how input is validated and displayed safely, how dependencies were checked, how login and authorisation work (if any), what personal data you collect and why, and what you chose not to collect.

**6. README and handover.** A README in the repository: what the app does, how to run it locally, the environment variables it needs (names only, never values), how to deploy and roll back, what is logged, known issues and technical debt, and when to call a professional engineer.

## What good looks like

A reviewer can follow the thread from the map and the spec to the code, the tests and the handover. Good submissions are specific and honest: they show where the AI got it wrong and what you did about it, and they name the weaknesses that remain. Never include real secrets or real users' personal data in anything you submit.`,
  rubric: [
    {
      criterion: "Systems view of the app",
      weight: 20,
      description:
        "Does the system map cover users, data flows (with personal data marked), integrations, hosting, ownership and failure modes? Is a genuine feedback loop described and labelled correctly, and do later decisions (scope, security, monitoring, handover) visibly follow from the map?",
    },
    {
      criterion: "Spec and scope",
      weight: 15,
      description:
        "Are the user stories real, the acceptance criteria testable in Given/When/Then form with edge and error cases, the non-goals explicit, and the definition of done verifiable? Does the delivered app match the spec, with scope creep avoided or openly justified?",
    },
    {
      criterion: "Small, reviewed build loops",
      weight: 20,
      description:
        "Does the Git history show small, meaningful commits? Do the chosen commits show what was asked of the AI, what was checked and what was rejected or corrected? Is at least one bug reproduced, isolated, fixed and explained?",
    },
    {
      criterion: "Testing and verification",
      weight: 15,
      description:
        "Do tests or a test plan cover every acceptance criterion and meaningful edge cases, with honest results? Is there evidence that tests fail on broken code, and that AI changes to tests were reviewed?",
    },
    {
      criterion: "Security and data",
      weight: 15,
      description:
        "Are secrets kept out of the front end and the repository, input validated on the server and displayed safely, dependencies checked, authorisation enforced on the server where relevant, and personal data minimised with reasons?",
    },
    {
      criterion: "Shipping and handover",
      weight: 15,
      description:
        "Is the app deployed and usable? Could another person run, configure, deploy and roll it back from the README alone? Are logging choices safe, costs and limits considered, technical debt and known issues named, and the point at which to call a professional engineer stated?",
    },
  ],
};
