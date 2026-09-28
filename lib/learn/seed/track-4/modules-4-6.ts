import type { SeedModule } from "../types";

// Vibe Coding Like a Software Engineer: Modules 4-6.
// Illustrative examples only. No invented statistics, studies, companies or incidents.
// Playground and try blocks are written as \`\`\` fences inside template literals.

export const TRACK_4_MODULES_4_TO_6: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 4
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Testing and Verification",
    summary:
      "Prove that what the AI built actually works: manual test plans, acceptance tests and edge cases, automated tests you have checked can fail, and reviewing every AI change like a senior engineer.",
    lessons: [
      {
        title: "\"It runs\" is not \"it works\"",
        objective: "Write a short manual test plan that covers the happy path and the ways a real user will break a feature.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## The gap between running and working

When an AI tool finishes a change, the page loads, the button appears and nothing turns red. It is tempting to call that done. It is not. "It runs" means the code did not crash on the one thing you tried. "It works" means it does what your spec says, for the inputs real people will give it, including the awkward ones.

The difference matters more with AI than without it. When you write code yourself, you at least thought about each line. When an AI writes it, nobody has thought about the cases you did not mention. The tool fills gaps with guesses, and guesses tend to look fine on the happy path.

## Happy path and everything else

The **happy path** is the journey where everything goes as intended: the user types a sensible value, clicks once, has a good connection and reads the result. It is the first thing you should test and the last thing you should trust.

Everything else is where bugs live:

- **Missing input**: the user clicks before filling anything in.
- **Unexpected input**: a word where a number should be, a negative quantity, a decimal where you expected a whole number.
- **Repeated actions**: clicking twice, refreshing mid-way, pressing Back.
- **The unhappy world**: slow network, a service that is down, an expired login.

Try the order calculator below. It passes the happy path (price 12.50, quantity 2). Now type nothing in quantity, then -3, then 2.7, then "two". Each one is a real user on a real day.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Order total</h3>
<label>Price per item (£) <input id="price" value="12.50"></label><br><br>
<label>Quantity <input id="qty" value="2"></label><br><br>
<button id="calc">Calculate</button>
<p id="out"></p>
<script>
document.getElementById("calc").onclick = function () {
  var price = parseFloat(document.getElementById("price").value);
  var qty = parseInt(document.getElementById("qty").value);
  var total = price * qty;
  // Try: empty quantity, -3, 2.7, "two", 99999999999
  // Then add checks here so each case gets a clear, friendly message.
  document.getElementById("out").textContent = "Total: £" + total.toFixed(2);
};
</script>
</body></html>
\`\`\`

You will see "Total: £NaN" (NaN means "not a number"), a negative total, and 2.7 quietly treated as 2. None of these crashed. All of them are wrong.

## A manual test plan you can actually use

A **manual test plan** is a short list of things to try by hand, with what should happen for each. It turns "I clicked around and it seemed fine" into something you can repeat after every change. It does not need special software. A table in your notes is enough:

\`\`\`text
Feature: Order total
| # | Step                          | Expected result                        | Pass? |
|---|-------------------------------|----------------------------------------|-------|
| 1 | Price 12.50, quantity 2       | Total: £25.00                          |       |
| 2 | Quantity left empty           | "Enter a quantity" message, no total   |       |
| 3 | Quantity -3                   | "Quantity must be 1 or more"           |       |
| 4 | Quantity 2.7                  | "Whole numbers only"                   |       |
| 5 | Quantity "two"                | "Enter a number"                       |       |
\`\`\`

Three habits make a plan useful:

1. **Write the expected result before you test.** Otherwise you will read whatever appears and decide it looks reasonable.
2. **Tie each row to your acceptance criteria** from Module 2. If a criterion has no test, you have not checked it.
3. **Re-run the plan after every change**, not only the rows you think the change touched. AI edits often reach further than you asked.

## Testing like a user, not an author

You know how the feature is meant to be used, so you use it that way without noticing. Real users do not. Before you test, put on a different hat: someone in a hurry on a phone, someone who pastes from a spreadsheet, someone whose name has an accent in it.

AI is good at brainstorming these cases, as long as you still decide which ones matter and check the results yourself:

\`\`\`try
Here is a feature I have built: [DESCRIBE THE FEATURE IN 2-3 SENTENCES].
Its acceptance criteria are: [PASTE YOUR CRITERIA].

Write a manual test plan as a table with columns: #, Step, Expected result.
Include the happy path first, then at least 8 cases where a real user
could break it (missing input, wrong type, repeated clicks, slow network).
Do not write any code. Flag any case where my criteria do not say what
should happen, so I can decide.
\`\`\`

The last line is the valuable one. Gaps in your spec show up as rows where nobody knows the expected result.

## Try it now

Pick one small feature you have built with AI (or use the order calculator above).

1. Run the prompt in the practice pad and get a test plan of at least eight rows.
2. Fill in the expected result for any row the AI flagged as unclear.
3. Carry out every row by hand and mark pass or fail.

You are done when you have a saved test plan with at least one failing row, and a note of what should change. If every row passed, add harder cases until one fails.`,
        microCheck: [
          {
            question: "An AI tool finishes a sign-up form and it loads without errors. What does that tell you?",
            options: [
              "The code ran for the one path you tried, and nothing more",
              "The form meets its acceptance criteria for normal users",
              "The form works, since the AI would have reported problems",
              "The edge cases are handled, because nothing crashed at all",
            ],
            correctIndex: 0,
            explanation:
              "Loading without errors only shows the code did not crash on what you tried. Whether it meets the spec, including awkward inputs, needs testing against the criteria.",
          },
          {
            question: "Why should you write the expected result in a test plan before running the test?",
            options: [
              "So you judge the output against a standard, not a feeling",
              "Because testing tools refuse to run without expected results",
              "So the AI can use your expected results to write the code",
              "Because the expected result is needed to reproduce the bug",
            ],
            correctIndex: 0,
            explanation:
              "If you decide what should happen after you see what did happen, you tend to accept whatever appears. Writing it first makes the test an honest check.",
          },
          {
            question: "The calculator shows \"Total: £NaN\" when quantity is empty. Which statement is most accurate?",
            options: [
              "It is a bug even though nothing crashed, because the spec was not met",
              "It is fine, because users will always fill in the quantity box first",
              "It is a browser problem, so there is nothing to fix in your own code",
              "It is only cosmetic, so it can wait until after the app has launched",
            ],
            correctIndex: 0,
            explanation:
              "A wrong result shown calmly is still wrong, and it is often worse than a crash because nobody notices. Users do leave fields empty, so the behaviour must be defined and handled.",
          },
          {
            question: "You asked the AI to change the button colour. Which parts of your test plan should you re-run?",
            options: [
              "The whole plan, because AI edits can reach further than asked",
              "Only the rows that mention the button, since nothing else moved",
              "None of it, because a colour change cannot affect behaviour",
              "Only the happy path, since edge cases were tested last time",
            ],
            correctIndex: 0,
            explanation:
              "AI tools sometimes touch code you did not ask about. Re-running a short plan is cheap, and it catches knock-on changes you would otherwise ship without knowing.",
          },
          {
            question: "What is the most useful thing to ask an AI for when brainstorming test cases?",
            options: [
              "Cases where your acceptance criteria do not say what should happen",
              "A confirmation that the code is correct and ready to be shipped",
              "A list of every possible input, however unlikely it may be",
              "Test cases that the current version of the code already passes",
            ],
            correctIndex: 0,
            explanation:
              "Gaps in the spec are where AI guesses. Asking it to flag cases with no defined behaviour lets you make those decisions yourself instead of discovering them in production.",
          },
        ],
      },
      {
        title: "Acceptance tests and edge cases",
        objective: "Turn acceptance criteria into acceptance tests and extend them with a standard list of edge cases.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## From criteria to tests

In Module 2 you wrote acceptance criteria in Given/When/Then form. Each one is already most of a test. An **acceptance test** is simply that criterion run against the real feature, with a clear pass or fail.

Take this criterion for a waiting-list form:

\`\`\`text
Given I am on the waiting-list page
When I enter my name and click Join
Then my name appears in the list once
And the Join button cannot be clicked again until the save finishes
\`\`\`

The test is: do exactly that, and check both Then lines. If the name appears twice, it fails, even if the page looks lovely.

Good criteria make testing almost mechanical. Vague criteria ("the form should work well") make it impossible, which is a useful signal: if you cannot test it, go back and rewrite the criterion.

## The edge case checklist

An **edge case** is an input or situation at the edge of what the feature expects. Most bugs in AI-built apps hide here, because prompts describe the normal case. Run every input field and button through this list:

- **Empty**: nothing typed, or only spaces.
- **Huge**: a 5,000-character name, a price of 99999999999, a 50 MB upload.
- **Zero and negative**: quantity 0, quantity -1, a date in the past.
- **Wrong type**: letters in a number box, a number where an email should go.
- **Unicode**: accents and other scripts (Zoë, Ñúñez, 李), emoji, right-to-left text. Unicode is the standard that lets computers store text in every writing system.
- **Double click**: the user clicks Submit twice because nothing seemed to happen.
- **Slow network**: the request takes several seconds, or fails halfway.
- **Refresh and Back**: the user reloads mid-way or returns to a finished form.

You do not need a test for every combination. You need to know, for each item, what should happen, and to have tried the ones that matter most for your app.

## Double clicks and slow networks

These two go together and are easy to miss, because on your own fast connection the save is instant. Your browser's developer tools (usually opened with F12) include a network panel that can simulate a slow connection. Use it before you ship anything with a Submit button.

The playground below fakes a slow server with a 1.5 second delay. Click Join three times quickly. Then submit an empty name, and then a name made only of spaces.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Join the waiting list</h3>
<input id="name" placeholder="Your name">
<button id="join">Join</button>
<ul id="list"></ul>
<script>
var btn = document.getElementById("join");
function fakeServer(name, done) {
  // Pretend the network is slow: 1.5 seconds per request
  setTimeout(function () { done(name); }, 1500);
}
btn.onclick = function () {
  var name = document.getElementById("name").value;
  // Fix 1: trim the name and refuse it if empty.
  // Fix 2: set btn.disabled = true here, and false again when saved.
  fakeServer(name, function (saved) {
    var li = document.createElement("li");
    li.textContent = saved;
    document.getElementById("list").appendChild(li);
  });
};
</script>
</body></html>
\`\`\`

Now make the two fixes in the comments and test again. You have just written the behaviour that the second Then line in the criterion demanded.

## Getting AI to fill the gaps

Once you have tests, give them to the AI with the code. It is far better at fixing a specific failing case than at guessing what "make it robust" means.

\`\`\`try
Here are my acceptance criteria for [FEATURE]:
[PASTE GIVEN/WHEN/THEN CRITERIA]

For each input and button in this feature, go through this edge case list:
empty, huge, zero or negative, wrong type, unicode, double click,
slow network, refresh or Back.

Return a table: Edge case | What should happen | Is it covered by my
criteria? (yes/no). For every "no", propose one new Then line.
Keep proposals short. Do not change any code yet.
\`\`\`

Review the proposed Then lines before adopting them. Some will be sensible, some will be gold-plating (effort that adds polish nobody asked for). You decide which behaviours your app promises.

## Try it now

Choose one form or button in a project of yours, or use the waiting-list playground.

1. Run the prompt above in the practice pad.
2. Add at least three new Then lines to your criteria from its suggestions.
3. Test each edge case by hand, using the browser's slow network setting for at least one.

You are done when your criteria cover double click and empty input, and you have tested both and recorded pass or fail.`,
        microCheck: [
          {
            question: "A criterion says \"the form should handle errors gracefully\". What is the best next step?",
            options: [
              "Rewrite it as specific Given/When/Then lines you can test",
              "Ask the AI to decide what graceful means and to build that",
              "Leave it as it is, since testers will know what it means",
              "Delete it, because error handling cannot be tested at all",
            ],
            correctIndex: 0,
            explanation:
              "If a criterion cannot be tested, it cannot be checked. Rewriting it as specific behaviour makes it testable, whereas leaving it vague hands the decision to a guess.",
          },
          {
            question: "Your Save button works perfectly on your office connection. Which test are you most likely missing?",
            options: [
              "A slow network test, where users click again while they wait",
              "A test on a larger monitor, where the layout might then shift",
              "A test with a longer password, to check that it gets accepted",
              "A test in a private window, to check the cookies are all set",
            ],
            correctIndex: 0,
            explanation:
              "On a fast connection a save is instant, so double clicks never happen. On a slow one users click again, which is how duplicate orders and records appear.",
          },
          {
            question: "A user named Zoë cannot sign up, but John can. Which edge case category is this?",
            options: [
              "Unicode, meaning characters beyond plain English letters",
              "Wrong type, meaning letters entered where numbers belong",
              "Huge input, meaning values longer than the field allows",
              "Empty input, meaning no value at all reached the server",
            ],
            correctIndex: 0,
            explanation:
              "Accented letters, other scripts and emoji are Unicode characters. Code that only expects plain English letters can reject or corrupt real people's names.",
          },
          {
            question: "In the waiting-list playground, what stops the same name being added three times?",
            options: [
              "Disabling the button until the slow save has finished",
              "Adding a longer delay before the fake server responds",
              "Showing a message asking the user to click only once",
              "Moving the Join button further away from the input",
            ],
            correctIndex: 0,
            explanation:
              "Disabling the button while a request is in flight makes a second click impossible. Messages and layout changes rely on users behaving, which is exactly what edge cases assume they will not.",
          },
          {
            question: "The AI suggests twelve new Then lines for your small form. What should you do?",
            options: [
              "Choose the ones your app should promise and drop the rest",
              "Adopt all twelve, since more criteria always mean more quality",
              "Reject all twelve, since the AI should not influence the spec",
              "Adopt the first five, since that is a sensible number to test",
            ],
            correctIndex: 0,
            explanation:
              "The spec is your decision. Some suggestions will be real gaps and others will be gold-plating, so you choose what the app promises instead of accepting or rejecting everything.",
          },
        ],
      },
      {
        title: "Automated tests with AI, verified by you",
        objective: "Ask an AI to write unit tests from acceptance criteria, then prove each test would fail on broken code.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## What a test actually is

Manual test plans are slow to repeat. An **automated test** is a small piece of code that runs your code with a known input and checks the output. Once written, it re-runs in seconds, every time anything changes.

A **unit test** checks one small piece (a "unit", usually a single function) on its own. Every unit test has the same three parts:

- **Arrange**: set up the input.
- **Act**: call the code.
- **Assert**: check the result is what you expected. The **assertion** is the line that can fail. A test without a meaningful assertion is decoration.

## A test in plain JavaScript, and in a framework

Here is a rule: orders of £50 or more get 10% off. The playground holds the function, a tiny test runner and three tests. Run it and all three pass. Then **break the code on purpose**: change \`>=\` to \`>\` and watch which test fails.

\`\`\`playground
<!doctype html>
<html><body style="font-family:monospace;padding:16px">
<h3>Tiny test runner</h3>
<ul id="results"></ul>
<script>
// Code under test. Rule: orders of £50 or more get 10% off.
function applyDiscount(total) {
  if (total >= 50) return Math.round(total * 0.9 * 100) / 100;
  return total;
}
function test(name, fn) {
  var li = document.createElement("li");
  try { fn(); li.textContent = "PASS  " + name; li.style.color = "green"; }
  catch (e) { li.textContent = "FAIL  " + name + ": " + e.message; li.style.color = "crimson"; }
  document.getElementById("results").appendChild(li);
}
function expectEqual(actual, expected) {
  if (actual !== expected) throw new Error("expected " + expected + " but got " + actual);
}
test("no discount below £50", function () { expectEqual(applyDiscount(49.99), 49.99); });
test("10% off at exactly £50", function () { expectEqual(applyDiscount(50), 45); });
test("10% off above £50", function () { expectEqual(applyDiscount(120), 108); });
// Break the code: change >= to > above. Which test catches it?
// Then try 0.8 instead of 0.9. Do the tests notice?
</script>
</body></html>
\`\`\`

Real projects use a **test framework** (a tool that finds and runs tests and reports results). Jest and Vitest are common examples in JavaScript, and they share a similar style. The same test looks like this:

\`\`\`js
import { applyDiscount } from "./discount";

test("10% off at exactly £50", () => {
  expect(applyDiscount(50)).toBe(45);
});
\`\`\`

You do not need to memorise any framework. You need to be able to read a test and answer one question: what exactly is this checking?

## Asking AI to write tests from your criteria

AI tools write tests quickly. The trick is to give them your acceptance criteria, not just the code. Tests written only from the code tend to check what the code does, bugs included. Tests written from the criteria check what it should do.

\`\`\`try
Here are the acceptance criteria for [FUNCTION OR FEATURE]:
[PASTE CRITERIA]

Here is the code:
[PASTE CODE]

Write unit tests using [Jest / Vitest / plain assertions].
One test per criterion, plus tests for these edge cases: [LIST].
Name each test after the behaviour it checks.
Do not change the code under test. If a criterion looks untestable
or the code seems to break a criterion, say so instead of adjusting
the test to match the code.
\`\`\`

## Check that every test can fail

A test that cannot fail proves nothing. The simplest way to check is the one you just did in the playground: **break the code on purpose** and confirm a test goes red. Engineers call a deliberate small break a **mutation**. Try a few per function:

- flip a comparison (\`>=\` to \`>\`)
- change a number (0.9 to 0.8)
- return early or return the input unchanged

If you break something and every test stays green, a test is missing or too weak. Put the code back afterwards.

## When AI weakens the tests

This is the single most important habit in this lesson. When code fails its tests and you ask an AI to "make the tests pass", it may change the **tests** instead of the code. Watch for:

- an assertion deleted or commented out
- an expected value changed to match the wrong output (\`toBe(45)\` becomes \`toBe(50)\`)
- a test marked as skipped (\`test.skip\`) or removed entirely
- a test wrapped in a try/catch that swallows the failure

Each of these turns red to green without fixing anything. The rule is simple: **tests change only when the requirement changes**, and you make that call. When you ask for a fix, say "fix the code, do not modify the tests", then check the diff to see that it listened.

## Try it now

Use the playground or a small function of your own.

1. Run the prompt in the practice pad with your criteria and code.
2. Add the tests it writes (to the playground runner, or your project).
3. Make three deliberate mutations. For each, record which test failed.

You are done when every mutation is caught by at least one test. If one is not, write the missing test yourself and try again.`,
        microCheck: [
          {
            question: "Which part of a unit test is the part that can actually fail?",
            options: [
              "The assertion that compares the result with the expected value",
              "The arrange step that sets up the inputs for the code under test",
              "The act step that calls the function being tested with its input",
              "The test name that describes the behaviour being checked here",
            ],
            correctIndex: 0,
            explanation:
              "The assertion is the check. Arrange and act only run code, and the name only describes it, so a test with no meaningful assertion always passes.",
          },
          {
            question: "Why write tests from acceptance criteria instead of only from the existing code?",
            options: [
              "Tests from code tend to check what it does, including its bugs",
              "Test frameworks can only read criteria in Given/When/Then form",
              "Tests from code are slower to run than tests from the criteria",
              "Criteria are shorter, so the tests produced will be fewer lines",
            ],
            correctIndex: 0,
            explanation:
              "If the code is wrong, tests derived from it will confirm the wrong behaviour. Criteria describe what should happen, so tests built from them can expose the mistake.",
          },
          {
            question: "You change >= to > in the discount code and every test still passes. What does that mean?",
            options: [
              "No test checks the boundary, so a test is missing or too weak",
              "The change is harmless, because the tests are still all green",
              "The test runner is broken and needs to be reinstalled again",
              "The mutation was too small to matter for real customers here",
            ],
            correctIndex: 0,
            explanation:
              "A deliberate break that no test catches shows a gap in the tests. Here the missing case is exactly £50, which is where >= and > give different results.",
          },
          {
            question: "You asked the AI to make failing tests pass. The diff shows toBe(45) changed to toBe(50). What happened?",
            options: [
              "It weakened the test to match the wrong output instead of fixing it",
              "It corrected a typo in the test, which is a normal part of fixing",
              "It updated the requirement, which is fine if the tests now pass",
              "It improved the test, since the new value is closer to the input",
            ],
            correctIndex: 0,
            explanation:
              "Changing the expected value to match what the code returns turns red to green without fixing anything. Tests should only change when you decide the requirement has changed.",
          },
          {
            question: "Which instruction best protects your tests when asking an AI for a bug fix?",
            options: [
              "Fix the code, do not modify the tests, and then check the diff",
              "Make all of the tests pass by whatever method is the quickest",
              "Rewrite the tests and the code together so that they match",
              "Remove any test that is failing, then add it back again later",
            ],
            correctIndex: 0,
            explanation:
              "Saying the tests are off limits, then confirming in the diff, keeps the tests as an independent check. The other options all allow the check itself to be weakened.",
          },
        ],
      },
      {
        title: "Reviewing AI changes like a senior engineer",
        objective: "Review an AI-generated change by reading its diff, spotting scope creep and unexplained edits, and applying a checklist.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Read the diff, not the chat

After an AI tool makes a change, it usually tells you what it did. That summary is helpful and sometimes incomplete. The **diff** (the exact lines added and removed, which Git shows you from Module 3) is what actually changed. Senior engineers review the diff, not the description.

A diff looks like this. Lines starting with \`-\` were removed, lines starting with \`+\` were added, and lines with neither are unchanged context:

\`\`\`diff
 function formatPrice(p) {
-  return p.toFixed(2);
+  return "£" + Math.round(p);
 }
\`\`\`

You asked for a pound sign. You got a pound sign, and also a change from two decimal places to whole pounds. Nothing in the chat mentioned rounding. The code still runs, and £9.99 now shows as £10.

## Compare behaviour, not just text

Reading a diff tells you what text changed. Running old and new versions side by side tells you what behaviour changed. The playground does exactly that for the change above.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Before vs after</h3>
<table id="t" border="1" cellpadding="6" style="border-collapse:collapse">
<tr><th>Input</th><th>Before</th><th>After</th></tr>
</table>
<script>
// Before: what you had. After: the AI's version, meant only to add "£".
function formatBefore(p) { return p.toFixed(2); }
function formatAfter(p) { return "£" + Math.round(p); }
var samples = [0, 9.99, 10.5, 1234.567, -3.25];
samples.forEach(function (s) {
  var row = document.createElement("tr");
  var a = formatBefore(s), b = formatAfter(s);
  [String(s), a, b].forEach(function (text) {
    var cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
  });
  // Highlight rows where the number itself changed, not just the "£"
  if ("£" + a !== b) row.style.background = "#ffe4e6";
  document.getElementById("t").appendChild(row);
});
// Fix formatAfter so only the pound sign is added and no row turns pink.
</script>
</body></html>
\`\`\`

This is the same idea as your test suite: fixed inputs, compare outputs. A change that was meant to be cosmetic should leave every value intact.

## Scope creep and unexplained changes

**Scope creep** is when a change grows beyond what was asked. With AI it is common and quiet: you ask for a bug fix and the tool also renames variables, reformats a file, upgrades a package or "tidies" a function it passed on the way. Each extra edit is a place a new bug can hide, and it makes the diff harder to review.

Warning signs in a diff:

- files changed that have nothing to do with your request
- deleted code with no explanation, especially checks, validation or tests
- new packages added to the project
- changed configuration, environment settings or security rules
- a very large diff for a small request

None of these is automatically wrong. Each needs a reason you understand. If you cannot explain a changed line, you are not ready to accept it.

## A review checklist

Use this every time, and keep it next to your editor:

\`\`\`text
[ ] Does the diff do what I asked, and only that?
[ ] Can I explain every changed line in plain words?
[ ] Were any checks, tests or validation removed or weakened?
[ ] Were any files, packages or settings changed that I did not expect?
[ ] Do the automated tests still pass, unchanged?
[ ] Have I re-run my manual test plan on the affected feature?
[ ] Is anything secret (keys, passwords) now visible in the code?
\`\`\`

When something is unclear, make the AI explain itself before you accept it:

\`\`\`try
Here is a diff of a change you made:
[PASTE THE DIFF]

My original request was: [PASTE YOUR REQUEST]

For every changed line, say which part of my request it serves.
List separately any change that was NOT needed for my request.
Point out anything removed, any behaviour that changed, and any
new package or setting. Do not make further changes.
\`\`\`

Then decide: keep what serves the request, and revert the rest (Git makes that easy). Smaller changes are easier to review, which is one more reason to work in the small loops from Module 3.

## Try it now

Take the last change an AI tool made to one of your projects (or fix the playground's \`formatAfter\`).

1. Open the diff and apply the checklist line by line.
2. Run the prompt above in the practice pad for any line you cannot explain.
3. Revert anything that was not needed for your request.

You are done when you can say, for every remaining changed line, why it is there.`,
        microCheck: [
          {
            question: "The AI says it \"only added a pound sign\". Where do you confirm what really changed?",
            options: [
              "In the diff, which shows every line that was added or removed",
              "In the chat summary, which the tool writes after each change",
              "In the browser, by checking the page looks the same as before",
              "In the file names, by checking which files the tool mentioned",
            ],
            correctIndex: 0,
            explanation:
              "Summaries can leave things out, and a page can look right while values change. The diff is the complete record of what the change actually did.",
          },
          {
            question: "You asked for a typo fix and the diff touches nine files. What is the right response?",
            options: [
              "Find out why each file changed and revert what was not needed",
              "Accept it, since the tool probably improved the other files too",
              "Reject it all and switch to a different AI tool for the project",
              "Accept it if the page still loads, then review it at a later date",
            ],
            correctIndex: 0,
            explanation:
              "A big diff for a small request is a classic sign of scope creep. Each extra change needs a reason you understand, and anything unneeded should be reverted.",
          },
          {
            question: "Which change in a diff deserves the closest scrutiny?",
            options: [
              "A validation check that was removed without any explanation",
              "A variable renamed to something that is more descriptive",
              "A comment added to explain what a function is meant to do",
              "Some blank lines added between functions to aid readability",
            ],
            correctIndex: 0,
            explanation:
              "Removed checks are a common way AI changes quietly break safety or correctness. Renames, comments and spacing still need a glance but rarely change behaviour.",
          },
          {
            question: "Why run old and new versions on the same inputs, as in the playground?",
            options: [
              "It shows changes in behaviour that reading text can easily miss",
              "It is the only way to check that the code has no syntax errors",
              "It replaces the need for a diff, so you can skip reading it",
              "It makes the new version run faster by caching the old results",
            ],
            correctIndex: 0,
            explanation:
              "A one-line text change can alter many outputs. Comparing results side by side makes behaviour changes visible, and complements reading the diff rather than replacing it.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A founder demos a new booking form: it loads and one test booking goes through. They plan to launch today. What is the strongest advice?",
        options: [
          "Run a short test plan with edge cases first, since one booking only proves the happy path",
          "Launch now, since a successful booking shows the form works and edge cases are rare in practice",
          "Launch now and ask the AI whether it expects any bugs, then fix what it predicts",
          "Delay the launch until an engineer has rewritten the form from scratch by hand",
        ],
        correctIndex: 0,
        explanation:
          "One success shows the happy path runs. A short test plan with edge cases is quick and catches the problems real users will hit. A full rewrite is out of proportion to the risk.",
      },
      {
        question: "Your acceptance criterion reads \"Then the user sees their order total\". The app shows \"£NaN\" for an empty quantity. What is the underlying problem?",
        options: [
          "The criteria never say what happens with empty input, so the AI guessed",
          "The browser is showing NaN because it does not fully support the £ symbol",
          "The quantity box needs a larger font so that users notice it more",
          "The AI tool made a random error that is unlikely to happen again",
        ],
        correctIndex: 0,
        explanation:
          "Behaviour you do not specify is left to the tool's guess. Adding a Then line for empty quantity turns a surprise into a decision you made and can test.",
      },
      {
        question: "An analyst builds a tool that imports customer names. Which test is most likely to reveal a real problem?",
        options: [
          "Importing names with accents, other scripts and apostrophes in them",
          "Importing names that are all written in plain capital English letters",
          "Importing the same short sample file that was used during the build",
          "Importing names in the order they were typed into the spreadsheet",
        ],
        correctIndex: 0,
        explanation:
          "Real names include Unicode characters and punctuation such as O'Brien. Plain samples or the build's own file only repeat the happy path.",
      },
      {
        question: "Customers report duplicate orders, but only on mobile. Which cause should you test first?",
        options: [
          "A double click during a slow save, with the button left enabled",
          "A layout bug that shows the Order button twice on small screens",
          "A mobile browser that does not support modern JavaScript features",
          "A payment provider that treats mobile orders as a separate type",
        ],
        correctIndex: 0,
        explanation:
          "Mobile connections are often slower, so users tap again while waiting. Testing with a throttled network and checking the button is disabled during the save is the quickest way to confirm it.",
      },
      {
        question: "The AI writes ten unit tests for your function and all pass first time. What should you do before trusting them?",
        options: [
          "Break the code on purpose a few ways and check a test fails each time",
          "Ask the AI to confirm that the tests are thorough and well written",
          "Count them, since ten tests is enough for a function of that size",
          "Run them again, since a second pass rules out any false positives",
        ],
        correctIndex: 0,
        explanation:
          "Passing tests only matter if they can fail. Deliberate mutations reveal whether the tests actually check behaviour. Counting tests or asking the AI tells you nothing about their strength.",
      },
      {
        question: "A test fails. You ask the AI to fix it, and the diff wraps the test body in a try/catch that ignores errors. What is the problem?",
        options: [
          "The test can no longer fail, so the bug is hidden rather than fixed",
          "The try/catch makes the test slower, which will delay every build",
          "Nothing, since catching errors is a standard way to make code safe",
          "The test name should also change to show that it now catches errors",
        ],
        correctIndex: 0,
        explanation:
          "Swallowing the failure turns red to green without touching the bug. Tests should only change when you decide the requirement has changed.",
      },
      {
        question: "Which unit test is weakest?",
        options: [
          "One that calls the function and asserts only that it returned something",
          "One that asserts a £50 order becomes exactly £45 after the discount is applied",
          "One that asserts a £49.99 order is returned with no discount applied",
          "One that asserts a negative total raises an error with a clear message",
        ],
        correctIndex: 0,
        explanation:
          "Asserting only that something came back would pass for almost any wrong answer. The others check specific, meaningful behaviour, including the boundary and an error case.",
      },
      {
        question: "You asked the AI to fix a login bug. The diff also upgrades two packages and edits the database settings. What is the best response?",
        options: [
          "Ask it to explain each extra change, then revert the ones not needed",
          "Accept it, since package upgrades are always good for security",
          "Accept the login fix and trust that the settings change is harmless",
          "Revert everything and fix the login bug by hand without the AI",
        ],
        correctIndex: 0,
        explanation:
          "Unrequested changes to packages and settings are scope creep in risky areas. Getting an explanation and reverting what is not needed keeps the useful fix and removes the unknowns.",
      },
      {
        question: "Why do small, frequent AI changes make review easier than one large change?",
        options: [
          "Each diff is short enough to understand every line before accepting it",
          "AI tools make fewer mistakes when the prompts are sent more frequently",
          "Small changes do not need testing, so the review can be much quicker",
          "Git cannot display diffs larger than a few hundred lines on screen",
        ],
        correctIndex: 0,
        explanation:
          "Review only works if you can explain each changed line. A small diff makes that possible, and if something breaks you know which change caused it.",
      },
      {
        question: "A junior developer says: \"The tests pass, so I didn't read the diff.\" What is the flaw in that reasoning?",
        options: [
          "Tests only cover what they check, and the diff may have changed the tests",
          "Tests are not reliable in JavaScript, so a diff review is the only check",
          "Passing tests prove the code is correct, so the reasoning is actually fine",
          "Diffs are only useful for spotting formatting problems, not for any logic",
        ],
        correctIndex: 0,
        explanation:
          "Tests are a partial check, and an AI may have weakened or deleted them to get to green. Reading the diff is how you see both of those things.",
      },
      {
        question: "Where does a manual test plan fit alongside automated tests?",
        options: [
          "It covers journeys and feel that are hard to automate, and seeds new tests",
          "It is replaced entirely once there is at least one automated test per file",
          "It is only needed for apps with no code, such as spreadsheets and forms",
          "It should be written after launch, based on what users report as bugs",
        ],
        correctIndex: 0,
        explanation:
          "Manual plans catch things like confusing messages and full user journeys, and the cases you find by hand are good candidates to automate. Both have a place.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 5
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Security, Data and Quality",
    summary:
      "Keep secrets out of code, treat every input as untrusted, check packages before you install them, and handle logins, permissions and personal data with proven tools and the least access needed.",
    lessons: [
      {
        title: "Secrets and API keys",
        objective: "Store API keys and other secrets in environment variables, keep them out of front-end code and Git, and rotate a key that has leaked.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## What counts as a secret

A **secret** is any value that lets someone act as you or your app. The most common one in AI-built projects is an **API key**: a long string that proves to a service (an AI model provider, a payment processor, an email service) that a request comes from your account. Whoever holds the key can spend your money and read or change your data.

Other secrets include database passwords, signing keys for login sessions, webhook secrets and the private half of any key pair. Treat them all the same way: they never appear in code, screenshots, chat messages or Git.

## Anything in the browser is public

The most common mistake is putting a key in **front-end code**, the HTML, CSS and JavaScript that runs in the visitor's browser. It feels hidden inside a variable. It is not. The browser has to download the code to run it, so any visitor can read it using View Source or the developer tools. Minifying or bundling the code (squashing it into a compact file) does not change that.

The playground "hides" a key in a variable. Click the button to see what every visitor receives.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Weather widget</h3>
<p>This page keeps its API key in a JavaScript variable.</p>
<button id="peek">Show what any visitor can read</button>
<pre id="out" style="white-space:pre-wrap;background:#f4f4f4;padding:8px"></pre>
<script>
var API_KEY = "sk_demo_THIS_IS_NOT_A_REAL_KEY_12345";
function getWeather(city) {
  // A real app would call a paid weather API here using API_KEY.
  return "Sunny in " + city;
}
document.getElementById("peek").onclick = function () {
  // Nothing clever here: the browser already has the full source.
  document.getElementById("out").textContent = document.scripts[0].textContent;
};
</script>
</body></html>
\`\`\`

The fix is architectural, not cosmetic. The key must live on a **server** (code that runs on a machine you control, including serverless functions). The browser asks your server, your server adds the key and calls the service, and only the result goes back to the browser.

Be careful with frameworks that expose variables to the browser by name. For example, in Next.js any variable whose name starts with \`NEXT_PUBLIC_\` is bundled into front-end code, and Vite does the same with \`VITE_\`. Those prefixes are for values that are meant to be public. A secret must never have one.

## Environment variables and .gitignore

An **environment variable** is a named value supplied to your app by the place it runs, rather than written in the code. Locally, most tools read them from a file called \`.env\`:

\`\`\`text
# .env  (never committed)
AI_API_KEY=sk-your-real-key-here
DATABASE_URL=postgres://user:password@host/db
\`\`\`

Your server code reads the value by name, for example \`process.env.AI_API_KEY\` in Node.js. Your hosting platform has a settings page where you enter the same names for the live app.

Then tell Git never to track the file. A **.gitignore** file lists paths Git should ignore:

\`\`\`text
# .gitignore
.env
.env.local
.env.*.local
\`\`\`

Add it **before** your first commit. Once a secret is committed, it is in the history even if you delete the file later. It is good practice to commit a \`.env.example\` with the names but fake values, so others know what to set.

## When a key leaks

Assume a key has leaked if it was ever in front-end code, a public repository, a screenshot or a shared chat. Deleting it is not enough, because copies may already exist. Do this, in order:

1. **Revoke or rotate** it in the provider's dashboard. Rotating means creating a new key and disabling the old one.
2. **Update** the new key in your environment variables, locally and on your host.
3. **Check usage and billing** for activity you do not recognise, and set a spending limit if the provider offers one.
4. **Fix the cause** so it cannot happen again: move the call server-side, add \`.gitignore\`, and review how it got there.

AI tools can help you find secrets before you ship:

\`\`\`try
Review the following code for secrets and credentials.
[PASTE YOUR FILES, WITH REAL KEYS REPLACED BY "REDACTED"]

List every place a key, password, token or connection string
appears or is read. For each, say whether it runs in the browser
or on a server, and whether it would be exposed to visitors.
Suggest how to move any exposed secret to a server-side
environment variable. Do not invent file names I have not shown.
\`\`\`

Notice the instruction to redact real keys first. Pasting a live key into any chat tool is itself a leak.

## Try it now

Open one project you have built with AI.

1. Search the code for words such as \`key\`, \`secret\`, \`token\` and \`password\`.
2. Check a \`.gitignore\` exists and lists your \`.env\` file.
3. Run the prompt above on any file that talks to an outside service.

You are done when no secret appears in front-end code or in Git, and you have written down which provider dashboard you would use to rotate each key.`,
        microCheck: [
          {
            question: "A founder stores their AI API key in a JavaScript variable in the page and says it is hidden. What is true?",
            options: [
              "Any visitor can read it, because the browser downloads the code",
              "It is safe as long as the variable name does not mention a key",
              "It is safe once the code is minified into a single compact file",
              "Only other developers can read it, since it needs special tools",
            ],
            correctIndex: 0,
            explanation:
              "Front-end code is sent to every visitor so the browser can run it. Renaming or minifying it changes nothing, so secrets must stay on a server.",
          },
          {
            question: "You committed a .env file with a live key, then deleted it in the next commit. What should you do?",
            options: [
              "Treat the key as leaked, rotate it and check for misuse",
              "Nothing more, because the file has now been deleted",
              "Rename the key inside the file so it looks different",
              "Make the repository private and keep using the key",
            ],
            correctIndex: 0,
            explanation:
              "The key is still in Git history and may already have been copied. Rotating it makes the leaked copy useless, whatever happens to the repository afterwards.",
          },
          {
            question: "In a Next.js app, what does naming a variable NEXT_PUBLIC_AI_KEY do?",
            options: [
              "It makes the value part of the browser code, visible to anyone",
              "It encrypts the value so it can be safely used in the browser",
              "It marks the value as optional so the app runs without it set",
              "It restricts the value so only logged-in users can ever read it",
            ],
            correctIndex: 0,
            explanation:
              "The NEXT_PUBLIC_ prefix tells the framework to bundle the value into front-end code. That is right for public settings and wrong for any secret.",
          },
          {
            question: "Why should .env be added to .gitignore before the first commit rather than later?",
            options: [
              "Once committed, the secret stays in history even after deletion",
              "Git refuses to ignore a file that has already been committed",
              "The .gitignore file only works when it is the first file added",
              "Hosting platforms reject projects whose history contains .env",
            ],
            correctIndex: 0,
            explanation:
              "Git keeps every past version. Ignoring the file afterwards stops future commits but does not erase the one that already contains the secret.",
          },
          {
            question: "You want an AI tool to check your code for exposed keys. What should you do first?",
            options: [
              "Replace any real keys with placeholders before you paste code",
              "Paste the code as it is, because AI chats are always private",
              "Ask the tool to promise it will forget the keys after reading",
              "Paste only the .env file, since that is where the keys are kept",
            ],
            correctIndex: 0,
            explanation:
              "Pasting a live key into any third-party tool is itself a leak. Redacting first lets the AI review structure without seeing the secret.",
          },
        ],
      },
      {
        title: "Untrusted input: injection and XSS",
        objective: "Recognise injection and cross-site scripting risks in AI-written code and apply parameterised queries, textContent and server-side validation.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## Every input is untrusted

Anything that comes from outside your code is **untrusted input**: form fields, URL parameters, uploaded files, data from another API, even text an AI model returns. Most users are honest. Your code cannot tell which ones are, so it must treat all input as data to be checked, never as instructions to follow.

Two classic attacks come from forgetting this. Both appear on the OWASP Top 10, a widely used list of the most serious web application security risks, and both are easy for AI tools to introduce when a prompt only describes the happy path.

## SQL injection

A database is usually queried with SQL, a language for reading and writing data. **SQL injection** happens when user input is glued directly into the text of a query, so the input can change what the query means.

\`\`\`js
// Dangerous: user input pasted into the SQL text
const sql = "SELECT * FROM users WHERE email = '" + email + "'";

// Safe: a parameterised query (placeholder syntax varies by library)
const rows = await db.query("SELECT * FROM users WHERE email = $1", [email]);
\`\`\`

In the first version, an "email" such as \`' OR '1'='1\` closes the quote and adds a condition that is always true, so the query returns every user. Worse inputs can change or delete data.

In the second version, the query and the data travel separately. A **parameterised query** (also called a prepared statement) tells the database: this is the command, and this is a value to use in it. The value can never become part of the command, whatever it contains. Most database libraries and ORMs (tools that let you work with the database through code objects) do this for you, as long as you use them as intended and do not build query strings by hand.

## Cross-site scripting (XSS)

**Cross-site scripting**, usually shortened to XSS, is the same mistake in the browser. If your page takes user text and inserts it as HTML, that text can include tags and scripts, which then run in other visitors' browsers with their logged-in session.

In JavaScript the difference is often one word. \`innerHTML\` treats a string as HTML code. \`textContent\` treats it as plain text. Try both in the playground, first with \`<b>bold</b>\` and then with the pre-filled payload, which only turns the page pink.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Comment preview</h3>
<textarea id="c" rows="3" cols="50"><img src=x onerror="document.body.style.background='pink'"></textarea><br>
<button id="unsafe">Show with innerHTML</button>
<button id="safe">Show with textContent</button>
<button id="reset">Reset</button>
<div id="out" style="border:1px solid #ccc;padding:8px;margin-top:8px;min-height:24px"></div>
<script>
var out = document.getElementById("out");
var box = document.getElementById("c");
document.getElementById("unsafe").onclick = function () {
  out.innerHTML = box.value; // treats the comment as code
};
document.getElementById("safe").onclick = function () {
  out.textContent = box.value; // treats the comment as text
};
document.getElementById("reset").onclick = function () {
  document.body.style.background = "white";
  out.textContent = "";
};
</script>
</body></html>
\`\`\`

The pink background stands in for anything a real attacker might do: read data on the page, send requests as the user or redirect them. The rules:

- Use \`textContent\` (or your framework's normal way of displaying text) for anything a user supplied.
- Frameworks such as React escape text by default. The escape hatches have alarming names for a reason (\`dangerouslySetInnerHTML\` in React). Treat any use of them as a review item.
- If you genuinely need user-supplied HTML, such as a rich text editor, use a well-known sanitising library rather than your own filter.

## Validate on the server, too

**Validation** means checking input is the right shape before using it: an email looks like an email, a quantity is a whole number from 1 to 99. Checks in the browser are good for the user, because they give instant feedback. They are not security. Anyone can bypass the browser and send requests straight to your server, so the server must repeat every check that matters.

Ask an AI tool to review for these problems specifically. A general "is this secure?" gets general reassurance.

\`\`\`try
Review this code for injection and cross-site scripting risks.
[PASTE SERVER AND FRONT-END CODE THAT HANDLES USER INPUT]

1. List every place user input reaches a database query, HTML,
   a shell command or a file path.
2. For each, say whether it is safe and why (parameterised query,
   textContent, escaping) or unsafe.
3. List validation that exists only in the browser and should
   also run on the server.
Show fixes as small, separate changes I can review one at a time.
\`\`\`

## Try it now

Use the playground, then one of your own projects.

1. In the playground, change the unsafe button to use \`textContent\` and confirm the payload now shows as harmless text.
2. In your project, search for \`innerHTML\`, \`dangerouslySetInnerHTML\` and SQL built with \`+\` or template strings.
3. Run the review prompt on the files that handle user input.

You are done when every place user input is displayed or queried uses a safe method, and each important check also runs on the server.`,
        resources: [
          {
            title: "OWASP Top 10",
            url: "https://owasp.org/www-project-top-ten/",
            resourceType: "article",
            isFree: true,
          },
          {
            title: "MDN: Web security",
            url: "https://developer.mozilla.org/en-US/docs/Web/Security",
            resourceType: "article",
            isFree: true,
          },
        ],
        microCheck: [
          {
            question: "An AI builds a search that runs \"SELECT * FROM products WHERE name = '\" + term + \"'\". What is the risk?",
            options: [
              "The search term can change the meaning of the query itself",
              "The search will be slow once the product table grows large",
              "The quotes will be shown to users in the search results page",
              "The query will fail for product names that include numbers",
            ],
            correctIndex: 0,
            explanation:
              "Gluing input into SQL text lets a crafted term add its own conditions or commands. Parameterised queries keep data separate from the command, whatever it contains.",
          },
          {
            question: "What makes a parameterised query safe against SQL injection?",
            options: [
              "The command and the values are sent separately to the database",
              "The user input is checked against a list of dangerous SQL words",
              "The query is encrypted before it is sent across to the database",
              "The database runs the query with a shorter timeout than normal",
            ],
            correctIndex: 0,
            explanation:
              "Because values travel separately, they can never become part of the command. Blocklists of dangerous words are easy to get around and are not a substitute.",
          },
          {
            question: "A comment feature shows user comments using innerHTML. What should you change?",
            options: [
              "Display comments with textContent so they are treated as text",
              "Limit comments to 200 characters so that scripts cannot fit",
              "Hide the comment box from users who have not yet logged in",
              "Add a warning asking users not to post any code in comments",
            ],
            correctIndex: 0,
            explanation:
              "textContent displays input as text, so tags and scripts never run. Length limits and warnings do not stop a short payload or a determined attacker.",
          },
          {
            question: "Your sign-up form checks the email format in the browser. Why also check on the server?",
            options: [
              "Requests can be sent straight to the server, skipping the browser",
              "Browsers often get email format checks wrong on older mobile devices",
              "Server checks run faster, so users receive feedback sooner",
              "The browser check is removed automatically when you deploy",
            ],
            correctIndex: 0,
            explanation:
              "Browser checks help honest users but anyone can bypass them. The server is the only place you control, so important validation must happen there.",
          },
        ],
      },
      {
        title: "Dependencies and hallucinated packages",
        objective: "Check that a package suggested by AI exists, is maintained and is widely used before installing it, and manage lockfiles and licences.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Every package is someone else's code

A **dependency** (or package) is code written by someone else that your project installs and runs, usually from a public registry such as npm for JavaScript or PyPI for Python. Dependencies save enormous time. They also mean you are running code you have not read, from people you do not know, with the same access as your own code.

AI tools add dependencies freely. Ask for a date picker and you may get three new packages. Each one is a decision you should make on purpose.

## Packages that do not exist

AI models sometimes suggest packages that do not exist. The name sounds right (a plausible mix of words like "react", "csv" and "parser") but nobody ever published it. This is a **hallucinated package**, the dependency version of a made-up fact.

On its own, that just causes an install error. The danger is that attackers can register those plausible names on public registries and fill them with malicious code. If a model suggests the same invented name to many people, some of them will install whatever is now there. Security researchers have called this **slopsquatting**, a play on typosquatting (registering misspellings of popular package names such as a letter swapped or a hyphen added).

So "the install worked" is not evidence the package is the one you wanted. It only shows that something with that name exists now.

## Check before you install

Before you run an install command an AI gives you, spend two minutes on the package's registry page and its source repository:

- **It exists and matches.** The name is spelt exactly as on the official page, and the description matches what you need.
- **It is widely used.** Weekly downloads and the number of projects depending on it are shown on most registry pages. A brand-new package with almost no users deserves suspicion.
- **It is maintained.** Look at the date of the last release and recent activity in the repository.
- **It is from who you expect.** Check the publisher and the linked repository. Documentation from a well-known project usually tells you its exact package name.
- **You actually need it.** Many tasks are one or two lines of built-in code.

The playground formats money and dates for different countries using \`Intl\`, which is built into every modern browser. No package needed. Change the locale or the amount.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>No package needed</h3>
<input id="amt" value="1234567.891">
<select id="loc">
  <option>en-GB</option><option>en-US</option><option>de-DE</option>
  <option>fr-FR</option><option>ja-JP</option>
</select>
<ul id="out"></ul>
<script>
function render() {
  var n = parseFloat(document.getElementById("amt").value);
  var loc = document.getElementById("loc").value;
  var items = [
    new Intl.NumberFormat(loc, { style: "currency", currency: "GBP" }).format(n),
    new Intl.NumberFormat(loc).format(n),
    new Intl.DateTimeFormat(loc, { dateStyle: "full" }).format(new Date()),
    new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-1, "day")
  ];
  var out = document.getElementById("out");
  out.textContent = "";
  items.forEach(function (t) {
    var li = document.createElement("li");
    li.textContent = t;
    out.appendChild(li);
  });
}
document.getElementById("amt").oninput = render;
document.getElementById("loc").onchange = render;
render();
</script>
</body></html>
\`\`\`

Make the AI justify its choices before you install anything:

\`\`\`try
You suggested installing these packages: [LIST PACKAGE NAMES].
For each one:
1. Say exactly what it is used for in my code.
2. Say whether the same thing can be done with built-in
   language or framework features, and show how if so.
3. Give the official registry page and source repository you
   believe it has, so I can check them myself.
Do not assume a package exists. If you are unsure, say so.
\`\`\`

Then open the pages yourself. The AI's answer is a lead to check, not proof.

## Lockfiles and updates

When you install packages, your package manager writes a **lockfile** (for example \`package-lock.json\` for npm). It records the exact version of every package, including the packages your packages depend on. Commit it to Git. It means your laptop, your colleague's laptop and your live server all install the same code, and a surprise new version cannot slip in unnoticed.

Updates still matter, because old versions accumulate known security flaws. Most package managers can report known vulnerabilities (\`npm audit\` is one example). Update deliberately, a few packages at a time, and re-run your tests after each batch.

## Licences

Every package comes with a **licence** that says what you may do with it. Permissive licences such as MIT and Apache 2.0 allow commercial use with light conditions, such as keeping the copyright notice. Copyleft licences such as the GPL can require you to share your own source code under certain conditions. Some packages have no licence at all, which means you have no clear permission to use them. Check the licence field on the registry page, and ask a qualified adviser if a commercial product depends on anything other than a well-known permissive licence.

## Try it now

Open the dependency list of one of your projects (for JavaScript, the \`dependencies\` section of \`package.json\`).

1. For each package, record: what it does, weekly downloads, date of last release and licence.
2. Run the prompt above for any package you cannot explain.
3. Remove one package that built-in features can replace, and re-run your tests.

You are done when every remaining dependency has a reason, a check and a licence written next to it, and your lockfile is committed.`,
        microCheck: [
          {
            question: "An AI tells you to install \"react-easy-csv-parser-pro\". The install succeeds. What does that prove?",
            options: [
              "Only that a package with that name exists on the registry now",
              "That the package is the well-known one the AI was describing to you",
              "That the package has been reviewed and scanned for malware",
              "That the package is compatible with your framework version",
            ],
            correctIndex: 0,
            explanation:
              "A successful install only shows the name is registered. Someone may have registered it recently to catch people following AI suggestions, which is what slopsquatting describes.",
          },
          {
            question: "Which package is most worth questioning before you install it?",
            options: [
              "One published last week with a handful of downloads and no repo",
              "One with years of releases that is used by many other open projects",
              "One named on the official documentation site of your framework",
              "One that your team already uses in several other live projects",
            ],
            correctIndex: 0,
            explanation:
              "New, barely used packages with no visible source are exactly what a slopsquatting or typosquatting attack looks like. The others have independent signs of trust.",
          },
          {
            question: "Why commit your lockfile to Git?",
            options: [
              "So every machine installs the exact same package versions",
              "So Git can warn you when a package has a security problem",
              "So packages install faster by skipping the download step",
              "So the registry knows which version you have a licence for",
            ],
            correctIndex: 0,
            explanation:
              "The lockfile pins every version, including indirect ones. Without it, a new release could be installed on your server that you never tested.",
          },
          {
            question: "Your commercial app depends on a package with no licence file at all. What does that mean?",
            options: [
              "You have no clear permission to use it, so find an alternative",
              "It is public domain, so you can use it for anything you like",
              "It is covered by MIT by default, since that is the most common",
              "It is fine as long as you credit the author in your README",
            ],
            correctIndex: 0,
            explanation:
              "No licence means no granted permission, not unlimited permission. For a commercial product, replacing it or getting advice is safer than assuming.",
          },
        ],
      },
      {
        title: "Logins, permissions and personal data",
        objective: "Use a proven authentication provider, enforce authorisation on the server with least privilege, and collect only the personal data you need.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Who are you, and what may you do?

Two words get mixed up constantly:

- **Authentication** answers "who are you?" It is the login: passwords, one-time codes, "Sign in with Google".
- **Authorisation** answers "what are you allowed to do?" It is the rule that Sam can see Sam's invoices but not Priya's, and only admins can delete anything.

Most serious problems in small apps are authorisation problems. The login works perfectly, and then any logged-in user can see everyone's data.

## Do not build your own login

It is easy to ask an AI to "add a login page with email and password", and it will. A safe login system needs far more than a form: secure password storage (hashing with a slow, purpose-built algorithm, never plain text), session handling, password reset flows that cannot be abused, protection against repeated guessing, email verification and more. Each is a place to get it subtly wrong, and you will not see the mistake until someone exploits it.

Use a proven **authentication provider** or your framework's established auth library instead. Examples at the time of writing include hosted services such as Auth0, Clerk and Firebase Authentication, the auth features built into platforms such as Supabase, and libraries such as Auth.js. These are examples, not recommendations, and features change: pick one that suits your stack and read its official documentation. Your job becomes configuring a well-tested system rather than inventing one.

## Check permissions on the server

The browser is controlled by the user. Anything you check there, they can change. The playground hides an admin button unless the user is an admin. Change \`"viewer"\` to \`"admin"\` and run it again.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Invoices</h3>
<p id="who"></p>
<button id="del" style="display:none">Delete all invoices</button>
<p id="msg"></p>
<script>
// Pretend this came from the login. Change "viewer" to "admin".
var currentUser = { name: "Sam", role: "viewer" };
document.getElementById("who").textContent =
  "Signed in as " + currentUser.name + " (" + currentUser.role + ")";
if (currentUser.role === "admin") {
  document.getElementById("del").style.display = "inline-block";
}
document.getElementById("del").onclick = function () {
  document.getElementById("msg").textContent = "All invoices deleted (pretend).";
};
// Any visitor can do what you just did, in their own browser.
// The server must check the role again before deleting anything.
</script>
</body></html>
\`\`\`

You just gave yourself admin powers by editing one word. Any visitor can do the same with the developer tools, or skip the page and send the delete request directly. Hiding a button is a convenience, not security.

The same applies to IDs in URLs. If \`/invoices/1041\` shows your invoice, try \`/invoices/1042\`. If it shows someone else's, the server is not checking that the invoice belongs to the logged-in user. This is one of the most common flaws in quickly built apps. The rule: **on every request, the server checks who the user is and whether they may do this to this record.** If you use a database with row-level security (rules in the database that limit which rows each user can read or change), turn it on and test it.

## Least privilege

**Least privilege** means giving every person, key and component only the access it needs, and no more.

- Most users are not admins. Admin accounts are few and protected with a second factor.
- The database key used by your app should not be able to drop tables if it only needs to read and write rows.
- An AI agent or automation should get read-only access unless it truly needs to write.
- A key that only needs to send email should not also manage billing.

When something goes wrong, least privilege limits how far it spreads. That is a systems idea: you cannot prevent every failure, so you design the connections so one failure does not cascade.

## Collect only the personal data you need

**Personal data** is information that identifies a person, directly or indirectly: names, emails, addresses, phone numbers, IP addresses, and more. Every field you store is something you must protect, might leak and may have to delete on request.

Before you add a field, ask what it is for. Do you need a date of birth, or only confirmation the user is over 18? Do you need a full address, or just a country? Data you never collected cannot leak.

Privacy law exists in many countries and varies between them. Examples include the GDPR in the EU and the UK's own version of it. Such laws often cover a lawful reason for processing, telling people what you collect, keeping it secure, and letting people access or delete it. The details depend on where you and your users are, so take proper advice before handling personal data at any scale.

\`\`\`try
Here is my app's data model and main routes:
[PASTE SCHEMA OR LIST OF TABLES/FIELDS, AND ROUTES]

1. For every route that reads or changes data, say what the server
   must check about the logged-in user, and whether my code does.
2. List any personal data field I may not need, and suggest a
   less sensitive alternative.
3. List any key or role with more access than it needs.
Do not suggest writing my own password handling.
\`\`\`

## Try it now

Pick one app you have built that has logins, or plan one you intend to build.

1. Log in as one user and try to open another user's record by changing the ID in the URL.
2. Run the prompt above and list every missing server-side check.
3. Remove or reduce one personal data field you do not need.

You are done when every data route has a written server-side rule, and your app stores one fewer piece of personal data than before.`,
        microCheck: [
          {
            question: "A logged-in user changes /orders/501 to /orders/502 and sees another customer's order. What failed?",
            options: [
              "Authorisation, because the server did not check who owns it",
              "Authentication, because the login system let the user in",
              "Encryption, because the order IDs were not hidden or scrambled",
              "Validation, because the order number was not a valid format",
            ],
            correctIndex: 0,
            explanation:
              "The user was correctly identified, so authentication worked. The server failed to check they were allowed to see that order, which is an authorisation check.",
          },
          {
            question: "Your admin page hides the Delete button from non-admins. Is that enough?",
            options: [
              "No, the server must also check the role on every delete request",
              "Yes, because users cannot see a button that is hidden from them",
              "Yes, as long as the button is removed from the HTML, not hidden",
              "No, the button should also ask for confirmation before deleting",
            ],
            correctIndex: 0,
            explanation:
              "Anyone can edit the page or send the request directly. Removing or confirming the button improves the interface, but only a server check enforces the rule.",
          },
          {
            question: "Why use a proven authentication provider instead of an AI-written login?",
            options: [
              "Safe login involves many subtle parts that are easy to get wrong",
              "AI tools are not able to write the code for a working login form",
              "Providers are always free, so they save money compared with code",
              "Custom logins are banned by privacy law in most countries today",
            ],
            correctIndex: 0,
            explanation:
              "Password storage, resets, sessions and brute-force protection are each easy to get subtly wrong. A well-tested provider handles them, and you configure rather than invent.",
          },
          {
            question: "Your app asks for date of birth only to confirm users are adults. What does data minimisation suggest?",
            options: [
              "Ask users to confirm they are over 18 instead of storing the date",
              "Store the date of birth but encrypt it in the database at all times",
              "Store the date of birth but only show it to admin users when needed",
              "Keep the date of birth, as it could be useful for later features",
            ],
            correctIndex: 0,
            explanation:
              "If a yes or no answers the question, the full date is not needed. Data you never collect cannot leak, whereas encrypted or restricted data still has to be protected.",
          },
          {
            question: "An automation only needs to read your customer table. What key should it get?",
            options: [
              "A read-only key limited to that table",
              "The same full-access key the app uses",
              "An admin key, so it never gets blocked",
              "A write key, in case it needs one later",
            ],
            correctIndex: 0,
            explanation:
              "Least privilege gives each component only the access it needs. If the automation misbehaves or its key leaks, read-only access to one table limits the damage.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A founder's AI-built app calls a paid AI API directly from browser JavaScript using their key. Usage bills suddenly jump. What is the most likely cause and fix?",
        options: [
          "The key was readable in the page; rotate it and move the call to a server",
          "The AI provider made a billing error; contact support to have it removed",
          "Users clicked the button too often; add a message asking them to slow down",
          "The key is too short; generate a longer one and keep it in the same place",
        ],
        correctIndex: 0,
        explanation:
          "Keys in front-end code are visible to anyone, who can then use them freely. Rotating stops the leaked key working, and a server-side call stops it happening again.",
      },
      {
        question: "Which setup keeps a database password safest in a small web app?",
        options: [
          "A server-side environment variable, with .env listed in .gitignore",
          "A constant at the top of the main JavaScript file served to users",
          "A comment in the code so the whole team can find it when needed",
          "A NEXT_PUBLIC_ variable so it can be changed without redeploying",
        ],
        correctIndex: 0,
        explanation:
          "Environment variables on the server keep the password out of code and out of browsers, and ignoring .env keeps it out of Git. The other options expose it to users or to history.",
      },
      {
        question: "A login form builds its query as \"... WHERE email = '\" + email + \"' AND password = '\" + pw + \"'\". What is the most serious problem?",
        options: [
          "SQL injection lets crafted input bypass the check, and passwords look unhashed",
          "The query is inefficient, which will make logins slow as the user base grows",
          "The email is case-sensitive, so users who type capitals cannot log in",
          "The query uses single quotes, which some database engines do not accept",
        ],
        correctIndex: 0,
        explanation:
          "Concatenating input into SQL allows injection, and comparing passwords directly in a query suggests they are stored in plain text. A proven auth provider avoids both.",
      },
      {
        question: "Your app shows each user's display name using innerHTML. A user sets their name to an image tag with an onerror script. What happens?",
        options: [
          "The script runs in other visitors' browsers wherever that name is shown",
          "The name is rejected by the browser, since tags are not allowed there",
          "The name shows as plain text, because innerHTML escapes it by default",
          "Only that user's own browser is affected, so there is little real risk",
        ],
        correctIndex: 0,
        explanation:
          "innerHTML treats the name as HTML, so the script runs for everyone who views it. That is stored XSS. Using textContent displays it as harmless text.",
      },
      {
        question: "A quantity field is limited to 1-10 in the browser. An attacker orders -500 items and receives a refund. Why?",
        options: [
          "The server trusted the value without repeating the range check",
          "The browser check was written in the wrong programming language",
          "The attacker guessed the admin password and changed the limit",
          "The database rounded the value because it was stored as text",
        ],
        correctIndex: 0,
        explanation:
          "Browser checks can be bypassed by sending requests directly. The server must validate every value that matters, including ranges and signs.",
      },
      {
        question: "An AI suggests installing a package you cannot find in any project's documentation. What should you do?",
        options: [
          "Check its registry page, downloads, repository and age before installing",
          "Install it, because the AI would not suggest a package that is unsafe",
          "Install it in a new branch, since branches are isolated from security risks",
          "Ask the AI to confirm it exists, and install it if the answer is yes",
        ],
        correctIndex: 0,
        explanation:
          "AI can suggest names that do not exist, and attackers can register them. Checking independent signals is the defence. A branch does not stop malicious install scripts running, and the AI's confirmation is not evidence.",
      },
      {
        question: "Two developers install the same project and get different behaviour. What is the most likely missing piece?",
        options: [
          "The lockfile was not committed, so they got different package versions",
          "One of them uses a different editor, which changes how the code runs",
          "The .gitignore file is missing, so the project will not build properly",
          "The project has too many dependencies for one machine to handle well",
        ],
        correctIndex: 0,
        explanation:
          "Without a committed lockfile, each install resolves versions afresh and can pick up new releases. The lockfile makes installs repeatable across machines.",
      },
      {
        question: "Which statement about building login for a new customer portal is most sound?",
        options: [
          "Use an established auth provider and focus your effort on authorisation rules",
          "Ask the AI for a custom login, since it will match your design more closely",
          "Store passwords in plain text at first and add hashing once users arrive",
          "Skip login for launch and rely on customers keeping the URL to themselves",
        ],
        correctIndex: 0,
        explanation:
          "A proven provider handles the hard parts of authentication. Your real work is deciding and enforcing who may see and change what, which no provider can do for you.",
      },
      {
        question: "Your internal dashboard uses one database key with full admin rights for everything. What principle does this break?",
        options: [
          "Least privilege, since each part should have only the access it needs",
          "Data minimisation, since the dashboard should store less personal data",
          "Separation of environments, since dashboards must not use a database",
          "Defence in depth, since there should be two keys for every single table",
        ],
        correctIndex: 0,
        explanation:
          "One all-powerful key means any bug or leak can do maximum damage. Least privilege limits each component's access, so one failure does not cascade.",
      },
      {
        question: "A founder wants to launch a sign-up form in several countries and asks whether privacy law applies. What is the best answer?",
        options: [
          "It likely does and varies by country, so collect less and take advice",
          "It only applies to large companies, so a new start-up can ignore it",
          "It is identical everywhere, so following one country's rules is enough",
          "It only applies to health data, so ordinary sign-up forms are exempt",
        ],
        correctIndex: 0,
        explanation:
          "Many countries have privacy laws that cover ordinary personal data such as emails, and they differ. Collecting only what you need and getting proper advice is the sound approach.",
      },
      {
        question: "Which package would you most want to check the licence of before shipping a paid product?",
        options: [
          "One whose registry page shows no licence at all",
          "One that shows the MIT licence on its page",
          "One that shows the Apache 2.0 licence on its page",
          "One that is part of your framework's own codebase",
        ],
        correctIndex: 0,
        explanation:
          "No licence means no clear permission to use the code. MIT and Apache 2.0 are well-known permissive licences, and framework packages are documented by the framework itself.",
      },
    ],
  },
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 6
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Shipping and Maintaining",
    summary:
      "Deploy through separate environments with a rollback plan, watch the live app with logs and monitoring, keep costs and limits under control, and document and hand over well, including knowing when to call an engineer.",
    lessons: [
      {
        title: "Deploying: environments, configuration and going live",
        objective: "Plan a deployment that uses separate environments, keeps configuration out of code and includes a tested rollback.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Three places your app lives

**Deploying** means putting your app on a server where other people can use it. Professional teams rarely deploy straight from their laptop to real users. They use separate **environments**, copies of the app that run the same code with different settings:

- **Local (development)**: your own machine. Fast to change, safe to break, uses test data.
- **Staging**: a private copy on the internet that behaves like the real thing. You test the deployed build here, with test accounts and test payments.
- **Production**: the live app your users rely on. Real data, real money, real consequences.

Many hosting platforms create a temporary **preview** deployment for every change, which works as a lightweight staging environment. Examples at the time of writing include Vercel, Netlify and Render. The names and features change, so check your platform's documentation. The idea is stable: see it working somewhere that is not production before production sees it.

## Same code, different configuration

The code should be identical in every environment. What differs is **configuration**: which database to use, which API keys, whether payments are real, which web address to call. As in Module 5, configuration lives in environment variables set per environment, never hard-coded.

The playground shows one page behaving differently depending on its environment. Change \`ENV\` to \`"production"\`, then to \`"prod"\` (a typo) and see what happens.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px;margin:0">
<div id="banner" style="padding:8px;color:white;font-weight:bold"></div>
<h3>Checkout</h3>
<p id="info"></p>
<script>
var ENV = "staging"; // try "development", "production", then "prod"
var CONFIG = {
  development: { api: "http://localhost:3000/api", banner: "LOCAL", colour: "#6b7280", payments: "test" },
  staging: { api: "https://staging.example.com/api", banner: "STAGING: test data only", colour: "#d97706", payments: "test" },
  production: { api: "https://www.example.com/api", banner: "", colour: "", payments: "live" }
};
var c = CONFIG[ENV];
var banner = document.getElementById("banner");
if (!c) {
  // Fail loudly rather than guessing which settings to use.
  banner.textContent = "Unknown environment: " + ENV + ". Refusing to start.";
  banner.style.background = "crimson";
} else {
  banner.textContent = c.banner;
  banner.style.background = c.colour;
  document.getElementById("info").textContent =
    "Calling " + c.api + " with " + c.payments + " payments.";
}
</script>
</body></html>
\`\`\`

Two habits from this: make non-production environments look obviously different (so nobody tests on live data by mistake), and make the app refuse to start with missing or unknown configuration rather than quietly falling back to something.

## Build versus run

Most modern apps go through two stages. The **build** turns your source code into files optimised for running: bundling, compiling, checking types. The **run** stage starts the app and serves those files. Some errors appear only at build time (a type error, a missing import), others only at run time (a missing environment variable, a database that cannot be reached). Your local development server often hides both, so run a production build locally or on staging before you ship. For a typical Node.js project that is something like \`npm run build\` followed by \`npm start\`, but check your own project's scripts.

## Going live and rolling back

A short checklist for the first launch:

\`\`\`text
[ ] Production environment variables set (and different from staging)
[ ] Build succeeds and the manual test plan passes on staging
[ ] Custom domain connected (DNS records point to your host) and HTTPS works
[ ] Error tracking and uptime check switched on (next lesson)
[ ] Database backed up, and you know how to restore it
[ ] Rollback plan written and tried once
\`\`\`

A **custom domain** is your own web address. Connecting it means adding DNS records (the internet's address book) at the company where you registered the domain, following your host's instructions. Changes can take a while to spread, so do not do it five minutes before a launch.

A **rollback** means returning production to the last version that worked. Many hosting platforms keep previous deployments and let you promote an old one with a click. With Git, you can also revert the bad commit and deploy again. Rollbacks of code are easy. Rollbacks of data are not: if a release changed the database structure or corrupted records, going back needs a backup. That is why database changes deserve extra care and a backup first.

\`\`\`try
My app is built with [FRAMEWORK] and hosted on [HOST, OR "NOT CHOSEN YET"].
It uses these services: [DATABASE, AUTH, PAYMENTS, AI API, ETC.].

Write me:
1. A list of environment variables it needs, marked per environment
   (development, staging, production), with fake example values.
2. A go-live checklist specific to this stack.
3. A rollback plan: exact steps to return to the previous version,
   and what to do if the release also changed the database.
Say clearly where I must check my host's current documentation.
\`\`\`

## Try it now

Take an app you have built, or one you plan to launch.

1. Run the prompt in the practice pad and adapt the checklist to your app.
2. Set up a staging or preview deployment if you do not have one.
3. Deploy a harmless change (such as a text edit) and then roll it back.

You are done when you have rolled back a deployment once on purpose and written down the steps it took.`,
        microCheck: [
          {
            question: "Why test on a staging environment before deploying to production?",
            options: [
              "It runs the deployed build safely, away from real users and data",
              "It is faster than local testing, so you can check more changes",
              "It is required by browsers before they will trust a new website",
              "It lets you skip writing tests, since users on staging report bugs",
            ],
            correctIndex: 0,
            explanation:
              "Staging behaves like production but with test data and test payments. Problems that only appear after a real build and deploy show up there first.",
          },
          {
            question: "Your app works locally but crashes in production with \"DATABASE_URL is undefined\". What is the likely cause?",
            options: [
              "The variable was never set in the production environment settings",
              "The build step removed the database code to make the whole app smaller",
              "The production server does not support the same database engine",
              "The code has a syntax error that only production browsers detect",
            ],
            correctIndex: 0,
            explanation:
              "Configuration lives in each environment separately. A value in your local .env file does not travel to production, so it must be set in the host's settings.",
          },
          {
            question: "In the playground, why does the page refuse to start when ENV is \"prod\"?",
            options: [
              "Failing loudly on unknown settings beats guessing the wrong ones",
              "The word prod is reserved by the browser for its own internal purposes",
              "Production apps must never show a banner of any kind at the top",
              "The config object can only hold three environments at most here",
            ],
            correctIndex: 0,
            explanation:
              "A silent fallback could send live traffic to test services, or test traffic to live payments. Stopping with a clear message makes the mistake obvious immediately.",
          },
          {
            question: "A release corrupted some customer records. You roll back the code. What else do you probably need?",
            options: [
              "A database backup to restore, because a code rollback leaves data as it is",
              "Nothing else, because rolling back the code also restores all the data",
              "A new domain name, because the old one is now permanently linked to the bad release",
              "A fresh build of the old version, because rollbacks delete the old build",
            ],
            correctIndex: 0,
            explanation:
              "Rolling back code does not undo changes already made to data. That is why backups, and knowing how to restore one, belong on the go-live checklist.",
          },
        ],
      },
      {
        title: "Logs, errors and monitoring",
        objective: "Set up logging, error tracking and uptime checks that shorten the delay between a problem appearing and you knowing about it.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## The delay you cannot see

On your laptop, when something breaks you see it immediately. In production, you do not. A payment step can fail for a week before a customer bothers to email you, and most will simply leave. In systems thinking terms there is a **delay** between cause (you ship a bug) and feedback (you find out). The longer the delay, the more damage builds up, and the harder it is to work out which change caused it.

Monitoring exists to shorten that delay. It turns production into a **feedback loop**: the app reports what is happening, you notice, you fix, and the app reports again. This is a balancing loop, pulling the system back towards "working" every time it drifts.

## Logs: what to record and what to leave out

A **log** is a timestamped record of what your app did. Good logs let you reconstruct what happened when something went wrong.

Worth logging:

- important events (user signed up, payment succeeded or failed, email sent)
- errors, with enough context to reproduce them: which page, which action, which record ID
- calls to outside services that fail or are slow
- a **request ID** (a unique label per request) so you can follow one user's journey across several log lines

Never log:

- passwords, API keys, session tokens or full card numbers
- more personal data than you need to debug (a user ID is usually enough, not their name, email and address)

Logs are often kept for a long time and read by many people and tools, so a secret in a log is a leak. The playground has a tiny logger that **redacts** (blanks out) sensitive fields, and catches errors like an error tracker would. Click both buttons, then add \`"email"\` to the \`SENSITIVE\` list.

\`\`\`playground
<!doctype html>
<html><body style="font-family:monospace;padding:16px">
<h3>Mini logger and error tracker</h3>
<button id="ok">Log a sign-up</button>
<button id="bad">Trigger a bug</button>
<ul id="log"></ul>
<script>
var SENSITIVE = ["password", "token"]; // what else belongs here?
function log(level, message, data) {
  var safe = {};
  Object.keys(data || {}).forEach(function (k) {
    safe[k] = SENSITIVE.indexOf(k) >= 0 ? "[REDACTED]" : data[k];
  });
  var li = document.createElement("li");
  li.textContent = new Date().toISOString() + " " + level + " " + message + " " + JSON.stringify(safe);
  if (level === "ERROR") li.style.color = "crimson";
  document.getElementById("log").appendChild(li);
}
window.onerror = function (msg, src, line) {
  log("ERROR", msg, { line: line, page: "checkout" });
};
document.getElementById("ok").onclick = function () {
  log("INFO", "user signed up", { userId: 42, email: "sam@example.com", password: "hunter2", plan: "free" });
};
document.getElementById("bad").onclick = function () {
  var basket = null;
  return basket.items.length; // a real bug: basket is empty (null)
};
</script>
</body></html>
\`\`\`

## Error tracking and uptime checks

Reading raw logs does not scale. Two tools do the watching for you:

- **Error tracking** services collect errors from your server and from users' browsers, group identical ones together, and show how often each happens and to how many users. Sentry is one well-known example, and many hosting platforms include basic error reporting. You install a small library and it reports crashes automatically.
- **Uptime checks** visit your site (or a special health-check address) every few minutes from outside, and alert you if it does not respond. Many services offer a free tier for a handful of checks.

Both are only useful if the alerts reach you and are rare enough that you still read them. Alert on things that need action (the site is down, the error rate jumped, payments are failing), not on every warning. An alert you learn to ignore is a feedback loop with the wire cut.

## Reading an error with AI

When an error arrives, AI is a good partner for understanding it, as long as you give it context and keep sensitive data out:

\`\`\`try
My error tracker reported this error in production:
[PASTE ERROR MESSAGE AND STACK TRACE, WITH PERSONAL DATA REMOVED]

It started after this change: [DESCRIBE OR PASTE THE DIFF]
It affects: [WHICH PAGE OR ACTION, HOW OFTEN]

1. Explain in plain words what the error means.
2. List the two or three most likely causes, most likely first.
3. For each, say what log line or test would confirm it.
Do not write a fix until I confirm the cause.
\`\`\`

This is the debugging loop from Module 3 applied to production: evidence first, then a hypothesis, then a small fix, then watch the monitoring to confirm it worked.

## Try it now

Take an app that is live, or about to be.

1. Add \`"email"\` to the \`SENSITIVE\` list in the playground, then check your own app's logs for any password, key or token.
2. Set up one uptime check on your live address with alerts to your phone or email.
3. Install error tracking (or switch on your host's), trigger a harmless test error, and confirm it arrives.

You are done when a deliberate test error and a deliberate downtime (or test alert) both reach you within minutes.`,
        microCheck: [
          {
            question: "Why is the delay between shipping a bug and hearing about it a problem?",
            options: [
              "Damage builds up while you are unaware and the cause gets harder to find",
              "Users become more patient over time, so they stop reporting problems",
              "The bug spreads to other apps on the same server if it is not caught",
              "Hosting platforms automatically roll back after a set number of days",
            ],
            correctIndex: 0,
            explanation:
              "Every hour a bug goes unnoticed, more users are affected and more changes pile on top. Monitoring shortens the delay so you fix it sooner and know what caused it.",
          },
          {
            question: "Which log line is the most appropriate for a failed payment?",
            options: [
              "Payment failed, order 881, user 42, provider said card_declined",
              "Payment failed for Sam Lee, card 4111 1111 1111 1111, CVC 123",
              "Payment failed, full request body and session token shown below",
              "Payment failed, something went wrong, please check it at some point",
            ],
            correctIndex: 0,
            explanation:
              "Good logs give IDs and the reason, enough to investigate. Card details and tokens must never be logged, and a vague message gives you nothing to act on.",
          },
          {
            question: "Your uptime check emails you about every tiny slowdown and you have started ignoring it. What is the real risk?",
            options: [
              "A real outage alert gets ignored along with all the noisy ones",
              "The uptime service will cancel your account for too many alerts",
              "The site slows down further because it is being checked so often",
              "Your inbox fills up, which is annoying but carries no other risk",
            ],
            correctIndex: 0,
            explanation:
              "Alerts only work if people act on them. Too many unimportant alerts cut the feedback loop, so tune them to fire only when action is needed.",
          },
          {
            question: "What does an error tracking service add over reading raw logs?",
            options: [
              "It groups identical errors and shows how often and whom they affect",
              "It fixes errors automatically by rewriting the code that caused them",
              "It stops errors reaching users by hiding them behind a friendly page",
              "It replaces the need for tests, since all errors are caught anyway",
            ],
            correctIndex: 0,
            explanation:
              "Grouping and counting shows which problems matter most. It tells you about errors after they happen, so it complements tests rather than replacing them.",
          },
        ],
      },
      {
        title: "Cost, performance and limits",
        objective: "Control the running cost and performance of an AI-built app using usage caps, caching, debouncing and awareness of rate limits and runaway loops.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## How usage turns into bills

Many services you build on charge by use: AI model APIs, email and SMS senders, maps, databases, hosting beyond a free tier. AI model APIs usually charge per **token** (a chunk of text, roughly part of a word), and output tokens usually cost several times more than input tokens. Long prompts, long conversation histories sent on every request and long answers all add up.

Prices change often, so this lesson avoids quoting them. What stays true is the shape: **cost equals calls multiplied by the cost of each call**. You control both numbers. Check your provider's current pricing page before launch and again whenever usage grows.

## Runaway loops

The most expensive bugs are loops. A **runaway loop** is code that repeats far more than intended:

- a page that calls an API every time it re-draws, and re-draws every time the API answers
- a retry that retries forever when a service is down, from every user at once
- an AI agent that keeps calling tools because nothing tells it to stop
- a scheduled job accidentally set to every minute instead of every day

In systems terms these are **reinforcing loops**: each call causes another. Nothing inside the loop slows it down, so you need a limit outside it. Every one of these can run all night while you sleep, which is why this lesson connects straight back to monitoring.

Protect yourself with balancing limits:

- **Spending caps and budget alerts** in every provider dashboard that offers them.
- **Maximum retries** with increasing waits between them (called exponential backoff).
- **Maximum steps** for any AI agent or automation.
- **Per-user limits** in your own app, so one user cannot trigger thousands of calls.

## Rate limits

Most APIs also enforce **rate limits**: a maximum number of requests per minute or per day. Go over it and the service rejects requests, usually with the HTTP status code 429 ("Too Many Requests"). A good app handles this calmly: it waits and retries a limited number of times, and shows the user a clear message rather than a blank screen. Check each provider's documented limits, because they vary by plan.

## Caching and debouncing

Two simple techniques cut calls dramatically in typical apps:

- **Caching** means saving a result and reusing it instead of asking again. If ten users ask for the weather in Leeds within a minute, you need one call, not ten.
- **Debouncing** means waiting until the user pauses before acting. A search box that calls an API on every keystroke sends one request per letter; debounced, it sends one when they stop typing.

Type a city name in the playground with the box unticked and watch the call count. Then tick it and type the same name again, and try one you already searched.

\`\`\`playground
<!doctype html>
<html><body style="font-family:sans-serif;padding:16px">
<h3>Search box cost meter</h3>
<input id="q" placeholder="Type a city name">
<label><input type="checkbox" id="smart"> Debounce and cache</label>
<p>API calls: <b id="calls">0</b> | Cost: <b id="cost">0.000</b> credits</p>
<p id="res"></p>
<script>
var COST_PER_CALL = 0.002; // made-up unit, not a real price
var calls = 0, cache = {}, timer = null;
function fakeApi(q) {
  calls++;
  document.getElementById("calls").textContent = calls;
  document.getElementById("cost").textContent = (calls * COST_PER_CALL).toFixed(3);
  return "Results for " + q;
}
function show(t) { document.getElementById("res").textContent = t; }
function search(q) {
  if (!q) return;
  var smart = document.getElementById("smart").checked;
  if (smart && cache[q]) { show(cache[q] + " (cached, free)"); return; }
  var r = fakeApi(q);
  cache[q] = r;
  show(r);
}
document.getElementById("q").oninput = function (e) {
  var q = e.target.value.trim().toLowerCase();
  if (!document.getElementById("smart").checked) return search(q);
  clearTimeout(timer);
  timer = setTimeout(function () { search(q); }, 400);
};
</script>
</body></html>
\`\`\`

Caching has one catch: cached data can go stale. Decide how long each kind of result stays valid (seconds for stock levels, hours for a list of countries) and say so in your spec.

## Performance basics

Speed is part of quality. The usual culprits in AI-built apps are easy to check: huge images that were never resized, the same data fetched several times on one page, and slow AI calls made while the user stares at a blank screen. Show progress for anything slow, and move heavy work out of the user's way where you can.

\`\`\`try
Here is the code for [FEATURE] that calls [API OR SERVICE]:
[PASTE CODE]

1. Estimate how many external calls one typical user session makes,
   and explain how you counted.
2. Point out any code that could loop or retry without limit.
3. Suggest where caching or debouncing would cut calls, and how long
   each cached result could safely be kept.
4. Say how the code should behave if the service returns a 429.
Keep each suggestion small and separate.
\`\`\`

## Try it now

Pick one app of yours that calls a paid API or service.

1. Set a spending cap or budget alert in that provider's dashboard today.
2. Run the prompt above on the code that makes the calls.
3. Add one limit: a retry maximum, a debounce, a cache or a per-user cap.

You are done when a budget alert is set and you can say the maximum number of calls one user can trigger in a minute.`,
        microCheck: [
          {
            question: "An AI feature's bill doubled overnight with no new users. What should you suspect first?",
            options: [
              "A loop or retry that kept calling the API with no limit on it",
              "A price rise by the provider that happened without any notice",
              "A browser update that made each page load a little bit slower",
              "Users writing longer messages because they like the feature more",
            ],
            correctIndex: 0,
            explanation:
              "A sudden jump without more users points to calls multiplying, which is what runaway loops and unlimited retries do. Spending caps and alerts catch this early.",
          },
          {
            question: "A search box calls an API on every keystroke. Which change cuts calls the most for typical typing?",
            options: [
              "Debounce, so it waits until the user pauses before calling",
              "Show a loading spinner so users know that a call is running",
              "Make the input box wider so users can see their full query",
              "Move the search box higher up the page so it loads earlier",
            ],
            correctIndex: 0,
            explanation:
              "Debouncing turns one call per letter into roughly one call per search. The other changes may help users but do not reduce the number of calls.",
          },
          {
            question: "Your app gets HTTP 429 responses from an API at busy times. What does that mean?",
            options: [
              "You have exceeded its rate limit, so wait and retry a few times",
              "The API key has expired, so you must generate a brand new one",
              "The server has crashed, so switch permanently to another provider",
              "The request format is wrong, so the code needs to be rewritten",
            ],
            correctIndex: 0,
            explanation:
              "429 means Too Many Requests. The right response is to back off and retry a limited number of times, and to reduce calls with caching if it keeps happening.",
          },
          {
            question: "Why is a runaway loop described as a reinforcing loop?",
            options: [
              "Each call triggers another, so it grows until an outside limit stops it",
              "It strengthens the code by testing the API many times in a row",
              "It balances itself out once the API starts to respond more slowly",
              "It only happens in apps that were written without any AI help",
            ],
            correctIndex: 0,
            explanation:
              "A reinforcing loop feeds itself. Nothing inside it slows it down, so you need balancing limits such as caps, maximum retries and step limits.",
          },
          {
            question: "You cache a product's stock level for 24 hours to save calls. What is the risk?",
            options: [
              "Users may see stale stock and order items that have sold out",
              "The cache will make each page load slower than it was before",
              "The API provider will charge more for requests that are cached",
              "The cache will be shared with other apps on the same hosting",
            ],
            correctIndex: 0,
            explanation:
              "Caching trades freshness for fewer calls. Fast-changing data needs a short cache time, so decide how long each kind of result stays valid.",
          },
        ],
      },
      {
        title: "Documentation, handover and knowing when to call an engineer",
        objective: "Write a README and decisions log for your app, spot technical debt building up, and decide when a project needs a professional engineer.",
        durationMinutes: 26,
        contentType: "article",
        bodyMd: `## Write it down for the next person (who may be you)

Six months from now you will not remember why the app uses two databases, which environment variable does what, or how to run the tests. Neither will the AI tool, which starts every session knowing nothing about your project unless you tell it. Documentation is the memory your project does not otherwise have.

You need two documents, both short, both kept in the repository next to the code.

## The README

A **README** is the front page of a project: what it is and how to get it running. A useful one answers the questions a new person asks in their first hour.

\`\`\`text
# [App name]
One or two sentences: what it does and who it is for.

## Run it locally
Prerequisites, install command, how to start it, how to run the tests.

## Configuration
Every environment variable, what it is for, where to get a value.
(Names and fake examples only. Never real secrets.)

## Deploying
Where it is hosted, how a release happens, how to roll back.

## Services and accounts
Every outside service (database, auth, payments, AI API),
who owns the account, and where billing and limits are set.

## Known issues
Anything fragile, unfinished or deliberately left out.
\`\`\`

A good README also makes AI tools more useful. Pasting it at the start of a session gives the tool the context it would otherwise guess.

## A decisions log

A **decisions log** records the important choices and why you made them. Engineers often call each entry an architecture decision record. Keep entries short:

\`\`\`text
## 2026-09-12: Use a hosted auth provider instead of custom login
Context: Need email and Google sign-in for the customer portal.
Decision: Use [provider]'s hosted login.
Why: Avoids writing password storage and resets ourselves.
Trade-off: Monthly cost grows with users; tied to their features.
Revisit if: We need login features they do not offer.
\`\`\`

The "why" is the valuable part. Without it, someone (or an AI) will later "simplify" the decision away without knowing what it protected.

## Technical debt: the loop that eats projects

**Technical debt** is the future cost of shortcuts taken now: copy-pasted code, missing tests, a quick fix on top of a quick fix, a function nobody understands. Some debt is a sensible trade to ship sooner. The danger is that it compounds.

In systems terms it is a **reinforcing loop**. Messy code makes changes riskier. Risky changes cause bugs. Under pressure, bugs get quick fixes, and quick fixes add mess. Round it goes, each lap faster: this is the "fix one bug, cause two" feeling. With AI the loop can spin faster still, because it is so cheap to generate another patch without understanding the last one.

Signs the loop is running:

- every change breaks something that seemed unrelated
- you are afraid to touch certain files
- the AI keeps producing fixes that do not stick
- nobody can explain how a key part works

The balancing forces are the habits from this track: small loops, tests that can fail, reviewed diffs, and time set aside to pay down debt (tidying, adding tests, deleting dead code) before adding features. You can use AI for that too:

\`\`\`try
Here is my project's README and main files:
[PASTE README AND KEY FILES, SECRETS REMOVED]

1. List the five worst areas of technical debt, most risky first,
   with one sentence each on why it is risky.
2. For the top one, propose a sequence of small, separately
   testable steps to improve it without changing behaviour.
3. Name any part that you think needs a professional engineer
   to review, and why.
Do not change any code yet.
\`\`\`

## When to call an engineer

Vibe coding with engineering habits takes you a long way: prototypes, internal tools, small apps with modest stakes. Some situations need a professional software engineer, or a security specialist, to design or review the work. Call one when:

- **Money moves**: you take payments, hold balances or issue refunds beyond what a hosted checkout handles for you.
- **Personal data at scale**: many people's personal data, or sensitive categories such as health, finances or children's data.
- **Regulated domains**: health, finance, legal, education records, or anything where a regulator could ask how the system works.
- **Many users or high stakes**: people depend on it for their work or safety, or downtime costs real money.
- **The debt loop has won**: fixes no longer stick and you cannot explain your own system.

Calling an engineer is not failure. It is the same judgement as knowing when a spreadsheet has become a database. A clear README, a decisions log, a test suite and a Git history make that handover fast and cheap, and signal that you did the job properly.

## Try it now

Take the app you have worked on most during this track.

1. Write its README using the template, filling in every section honestly.
2. Add three entries to a decisions log for choices you have already made.
3. Run the prompt above and decide, against the list, whether it needs an engineer's review.

You are done when a stranger could run your app locally from the README alone, and you have written a one-line verdict on whether to call an engineer.`,
        microCheck: [
          {
            question: "Why is the \"why\" the most important part of a decisions log entry?",
            options: [
              "Without it, someone may undo the decision without seeing its purpose",
              "Without it, the log cannot be read by AI tools in a later session",
              "Without it, Git will refuse to accept the commit containing the log file",
              "Without it, the entry is too short to be counted as documentation",
            ],
            correctIndex: 0,
            explanation:
              "A decision that looks odd without context invites someone to simplify it away. Recording the reason protects what the decision was guarding against.",
          },
          {
            question: "Every AI fix to your app breaks something else, and the fixes stack up. Which pattern is this?",
            options: [
              "A reinforcing loop of technical debt, where mess breeds more mess",
              "A balancing loop, where the app settles into a stable state quite soon",
              "A normal phase of every project that disappears once it launches",
              "A sign the AI model is out of date and needs to be swapped over",
            ],
            correctIndex: 0,
            explanation:
              "Quick fixes add mess, mess makes changes riskier, and risky changes cause more bugs. Breaking it needs balancing habits: tests, small changes and time spent paying down debt.",
          },
          {
            question: "Which project most clearly needs a professional engineer before launch?",
            options: [
              "An app storing thousands of patients' health notes for a clinic",
              "A personal tracker for your own reading list and book ratings",
              "An internal tool that formats a weekly report for your own team",
              "A landing page that collects nothing and links to a booking site",
            ],
            correctIndex: 0,
            explanation:
              "Sensitive personal data at scale in a regulated domain carries serious risk to people and legal exposure. The others have low stakes and little or no personal data.",
          },
          {
            question: "What belongs in a README's configuration section?",
            options: [
              "Each variable's name, purpose and where to get a value, with fake examples",
              "The real production keys, so the next person can start work straight away",
              "A copy of the whole .env file, so nothing is missed when setting up again",
              "Nothing at all, since configuration is private and should never be documented",
            ],
            correctIndex: 0,
            explanation:
              "Documenting names and purposes makes setup possible without exposing secrets. Real values belong only in environment settings, never in files that are shared or committed.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A founder deploys straight from their laptop to the live app after each AI change. Twice this month customers hit a broken checkout. What is the best structural fix?",
        options: [
          "Deploy to staging or a preview first and run the test plan there",
          "Deploy less often, perhaps once a month, to reduce the total risk",
          "Ask the AI to double-check its own code before each deployment",
          "Deploy late at night so fewer customers see the problems that occur",
        ],
        correctIndex: 0,
        explanation:
          "A staging step puts a check between change and customers. Deploying less often makes each release bigger and riskier, and self-checks by the AI are not independent.",
      },
      {
        question: "An app uses test payments on staging and live payments in production. Where should that difference be set?",
        options: [
          "In each environment's variables, with identical code in both places",
          "In the code, with an if-statement that checks the website's address",
          "In a comment at the top of the file, so developers remember to switch",
          "In a separate copy of the code, one for staging and one for production",
        ],
        correctIndex: 0,
        explanation:
          "Keeping code identical and varying configuration per environment is what makes staging a true rehearsal. Separate copies drift apart, and hard-coded checks are easy to get wrong.",
      },
      {
        question: "A release goes wrong on launch day. It changed code only, not the database. What is the fastest safe response?",
        options: [
          "Roll back to the previous deployment, then investigate calmly",
          "Ask the AI for a quick fix and deploy it straight to production",
          "Take the whole site offline until a full rewrite has been done",
          "Leave it running and wait to see whether users actually complain",
        ],
        correctIndex: 0,
        explanation:
          "Rolling back restores a known good version in minutes, and you can then fix the cause without pressure. A rushed fix in production risks adding a second problem to the first.",
      },
      {
        question: "Which set of fields is safest to include in a log entry for a failed login?",
        options: [
          "Time, user ID, reason code and request ID",
          "Time, email, the password typed and IP address",
          "Time, full request body and session cookie",
          "Time, user's full name, address and phone",
        ],
        correctIndex: 0,
        explanation:
          "A user ID, reason and request ID are enough to investigate. Passwords, cookies and extra personal details turn the log itself into something that can leak.",
      },
      {
        question: "Customers say a form has been broken \"for days\", but you only just heard. What would have shortened that delay most?",
        options: [
          "Error tracking and alerts that tell you when errors start or spike",
          "A larger server, so the form has more resources available to it",
          "A longer test plan, run once before the original release went out",
          "A contact page with a bigger button so customers report problems",
        ],
        correctIndex: 0,
        explanation:
          "Monitoring is a feedback loop that shortens the delay between a problem and your knowing about it. Relying on customers to report issues means most problems stay invisible.",
      },
      {
        question: "Your phone buzzes with dozens of low-priority alerts a day, and last week you missed a real outage. What should you change?",
        options: [
          "Alert only on things that need action, and route the rest to a report",
          "Turn off all alerts and check the dashboard once a week instead",
          "Add even more alerts so that nothing can possibly slip through",
          "Hand the alerts to an AI agent and let it decide what to do alone",
        ],
        correctIndex: 0,
        explanation:
          "Noisy alerts train you to ignore them, which cuts the feedback loop. Keeping alerts rare and actionable is what makes the important ones get noticed.",
      },
      {
        question: "An AI agent in your app retries a failing tool call forever, and the API bill spikes overnight. Which fix addresses the structure of the problem?",
        options: [
          "Cap retries and agent steps, and set a budget alert with the provider",
          "Switch to a cheaper model so that each retry costs a little less money",
          "Ask users not to use the feature at night when nobody is monitoring",
          "Increase the rate limit so that the retries succeed more quickly",
        ],
        correctIndex: 0,
        explanation:
          "A retry with no limit is a reinforcing loop, so it needs an outside balancing limit. A cheaper model still loops forever, just more slowly.",
      },
      {
        question: "Many users look up the same exchange rates, and each request calls a paid API. Which change most reduces calls while keeping data reasonably fresh?",
        options: [
          "Cache each rate for a short, agreed time and reuse it for all users",
          "Cache each rate permanently so the API is only ever called once",
          "Call the API twice per request and use whichever answer comes back",
          "Let each user choose whether to call the API for their own request",
        ],
        correctIndex: 0,
        explanation:
          "A short shared cache turns many identical calls into one while keeping data fresh enough. A permanent cache saves most but serves stale rates indefinitely.",
      },
      {
        question: "A junior developer inherits your app and cannot get it running. Which document would have helped most?",
        options: [
          "A README covering setup, configuration, tests and deployment",
          "A long chat history of every prompt used to build the app",
          "A folder of screenshots showing what each page of the app looks like",
          "A list of every AI tool and model version you have tried",
        ],
        correctIndex: 0,
        explanation:
          "A README answers the first-hour questions: how to install, configure, test and deploy. Chat histories and screenshots are hard to act on and often out of date.",
      },
      {
        question: "A founder's app has grown to thousands of paying users and stores their billing details. Every fix now breaks something else. What is the soundest next step?",
        options: [
          "Bring in a professional engineer to review and stabilise it",
          "Keep patching with AI, since it has worked well until now",
          "Rebuild the whole app from scratch with a different AI tool",
          "Freeze all changes permanently so that nothing else breaks",
        ],
        correctIndex: 0,
        explanation:
          "Money, personal data at scale and a debt loop that has taken hold are all signs to call an engineer. A rebuild with another tool repeats the same process, and freezing leaves known problems in place.",
      },
      {
        question: "Why should technical debt be paid down before it feels urgent?",
        options: [
          "It compounds, so each lap of the loop makes the next fix harder",
          "It expires, so after a year the shortcuts stop working entirely",
          "It is visible to users, who will notice the messy code directly",
          "It is counted by hosting platforms, which charge more for it",
        ],
        correctIndex: 0,
        explanation:
          "Technical debt is a reinforcing loop: mess makes changes risky, which breeds more mess. Paying it down early is cheap; waiting makes every future change more expensive.",
      },
    ],
  },
];
