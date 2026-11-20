import type { SeedModule } from "../types";

// Vibe Coding Like a Software Engineer (slug: vibe-coding-engineer), Modules 1-3.
// Systems thinking is the thread: "the code is the smallest part of the system".
// Module 1 maps the system around an app idea; later lessons refer back to it,
// to the bill splitter spec (Module 2) and to the renamed-id bug (Module 1 L4).

export const TRACK_4_MODULES_1_TO_3: SeedModule[] = [
  // ═════════════════════════════════════════════════════════════════════
  // MODULE 1
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Vibe Coding, Engineered",
    summary:
      "What vibe coding is, where it breaks, and the engineer's mindset: see the whole system around an app, pick the right kind of AI tool, and read enough HTML, CSS and JavaScript to follow what the AI writes.",
    lessons: [
      {
        title: "What vibe coding is, and where it breaks",
        objective: "Distinguish vibe coding from engineering with AI and predict where a vibe-coded app is likely to fail.",
        durationMinutes: 24,
        contentType: "article",
        isPreview: true,
        bodyMd: `## Where the term came from

In early 2025 the AI researcher Andrej Karpathy popularised the phrase "vibe coding" in a short social media post. In paraphrase: he described building software by talking to an AI, accepting the code it produced without really reading it, pasting any error message straight back in, and carrying on until the thing seemed to work. He presented it as a fun way to knock together throwaway weekend projects, not as a way to build software people depend on.

The name stuck because it described something a lot of people had started doing. You no longer need to know a programming language to get a working app on your screen. You describe what you want, and an AI writes the code.

This track takes that seriously. Vibe coding is real, useful and here to stay. The aim is not to stop you doing it. The aim is to add the habits professional software engineers use, so that what you build keeps working after the first demo.

## What vibe coding is genuinely good for

Accepting code you have not read is a reasonable bet when the cost of failure is low:

- **Prototypes**: a clickable version of an idea to show a colleague or test with five users.
- **Throwaway tools**: a one-off script to rename a folder of files or reshape a spreadsheet export.
- **Learning and exploring**: "show me what a drag-and-drop list looks like" to see what is possible.
- **Personal utilities**: a page only you use, holding no one else's data.

In all of these, if it breaks, you lose a few minutes and nobody else is harmed.

## Where it breaks

The trouble starts when a prototype quietly becomes something people rely on. Five failure points come up again and again.

1. **Maintenance.** Nobody understands the code, including you. The first change request turns into a long session of asking the AI to fix things its previous fix broke.
2. **Security.** AI tools can produce code with secret keys pasted into it, forms that accept anything, or pages that trust whatever the browser sends. You will not spot this if you never read the code.
3. **Data.** Real people's names, emails and payments bring legal duties, and real harm if they leak or get lost. A prototype that "saves to a database" may have no backups and no access control.
4. **Scale.** Something that works for one user on your laptop may fall over with fifty users, or cost far more to run than you expected.
5. **Hand-off.** When someone else needs to take over, there is no spec, no history of changes and no tests to tell them what "working" means.

None of these show up in the first demo. They appear weeks later, which is why vibe coding feels so productive at the start.

## Vibe coding versus engineering with AI

| | Vibe coding | Engineering with AI |
|---|---|---|
| Starting point | A loose idea in a chat box | A short written spec |
| Size of each step | "Build the whole app" | One small feature at a time |
| Checking | "It looks like it works" | Acceptance criteria and tests |
| Undo | Hope, or start again | Version control (Git) |
| Secrets and data | Wherever the AI put them | Deliberately handled |
| After launch | Nobody knows how it works | Someone can read, fix and extend it |

The AI does most of the typing in both columns. The difference is the process around it, and that process is what this track teaches.

## Before and after: the same idea

A vibe-coding prompt:

\`\`\`text
make me an app for my team to book the meeting room
\`\`\`

An engineered prompt for the same idea:

\`\`\`try
I want to build a small web page for my team of [8] people to book [our one meeting room].

Before writing any code:
1. Ask me up to 5 questions about anything unclear.
2. List what could go wrong if two people book the same slot.
3. Suggest the smallest first version I could test in one day.

Constraints: no user accounts in version one, no payments, must work on a phone.
\`\`\`

The second prompt does not ask for code at all. It asks for questions, risks and a small first step. That single change avoids several of the failures above before a line is written.

## Try it now

Run the engineered prompt above in the practice pad, changing the team size and the booking idea to something from your own work. Read the questions the AI asks you.

You are done when you have written down one question it raised that you had not thought about, and which of the five failure points (maintenance, security, data, scale, hand-off) that question relates to.`,
        microCheck: [
          {
            question: "A friend builds a one-off script with AI to rename 200 photos on their own laptop, without reading the code. Is that sensible?",
            options: [
              "No, any code you have not read in full is too risky to run",
              "Only if the AI also writes automated tests for the script",
              "Yes, it is low stakes, private and easy to redo if it fails",
              "Only if the script is kept in version control from the start",
            ],
            correctIndex: 2,
            explanation:
              "Vibe coding is a reasonable bet when failure is cheap and harms nobody else. Tests and version control are good habits, but insisting on them for a private throwaway script misses the point of matching effort to risk.",
          },
          {
            question: "A vibe-coded prototype for booking a meeting room is now used daily by 40 staff. Which problem is most likely to appear first?",
            options: [
              "A change request breaks something and nobody knows why",
              "The page stops loading because too many people use it",
              "The AI tool that wrote it refuses to edit its own code",
              "The browser blocks the page because it was AI-written",
            ],
            correctIndex: 0,
            explanation:
              "Maintenance is usually the first failure: nobody understands the code, so each fix risks breaking something else. Forty users is rarely a scale problem for a simple page, and tools and browsers do not treat AI code differently.",
          },
          {
            question: "What is the main difference between vibe coding and engineering with AI, as this lesson describes it?",
            options: [
              "Engineers write most of the code by hand and use AI for typing",
              "Engineering with AI needs paid tools, vibe coding uses free ones",
              "Vibe coding uses chat assistants, engineers use coding agents",
              "The process around the AI: specs, small steps, checks and undo",
            ],
            correctIndex: 3,
            explanation:
              "In both approaches the AI does most of the typing. What differs is the process around it: a spec, one step at a time, checking against criteria, version control and deliberate handling of data.",
          },
          {
            question: "Why does the engineered meeting-room prompt ask for questions and risks before any code?",
            options: [
              "AI tools give better code if they are made to wait longer",
              "Decisions made up front stop the AI silently guessing them",
              "Questions use fewer tokens than code, so it costs less",
              "It keeps the AI from writing code that runs on a phone",
            ],
            correctIndex: 1,
            explanation:
              "When a request is vague, the AI fills every gap with a guess. Asking it to surface questions and risks first lets you make those decisions yourself, which prevents rework later. Cost and waiting are not the reason.",
          },
        ],
      },
      {
        title: "Code is the smallest part of the system",
        objective: "Map the users, data, integrations, hosting, maintenance and feedback around an app idea before any code is written.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## An app is a system, not a file

Systems thinking, used across every TIBLOGICS track, describes a system as parts, connections and a purpose. Apply that to software and something surprising appears: the code is usually the smallest part.

Picture a simple online booking page for a small yoga studio. The code might be a few hundred lines. Around it sit:

- the **people** who book, cancel, forget, and email when something goes wrong
- the **studio owner**, who needs to see the day's bookings each morning
- the **data**: names, emails, class times, perhaps health notes
- **integrations**: the email that confirms a booking, the calendar it lands in, perhaps a payment provider
- **hosting**: where it runs, who pays for it, and what happens if that service changes its prices
- **maintenance**: who updates the timetable, who updates the code when something it depends on goes out of date, who gets the call when bookings stop arriving

An AI can write the few hundred lines in minutes. It cannot decide any of the rest for you.

## The 2am question

Engineers ask a blunt question about anything they build: **who fixes it at 2am?** If the booking page breaks on a Sunday night before a Monday class, who notices, who is told, and who can actually fix it?

For a vibe-coded app, the honest answer is often "nobody". The founder does not understand the code, the AI chat that wrote it is long gone, and there is no record of what changed. Asking the question early is cheap. Answering it late is expensive.

## Feedback loops around your code

Two loops matter in almost every software project.

**Technical debt is a reinforcing loop.** Technical debt means shortcuts in the code that make future changes harder: copy-pasted blocks, confusing names, no tests. Each rushed change adds a little debt. More debt makes the next change slower and riskier, so you rush more, which adds more debt. Left alone, this loop speeds up. Vibe coding feeds it quickly, because every "just make it work" fix is a shortcut you did not see.

**User feedback is a balancing loop.** You ship something, people use it, they tell you (or show you) what is wrong, and you correct course. This loop keeps the product close to what people need. It only works if feedback can reach you and you can change the code safely. That second condition is why the habits in this track (small steps, version control, tests) matter.

Watch for a **delay** too. The cost of a shortcut arrives weeks after the shortcut. Delays make systems hard to steer, because by the time you feel the problem, the cause is long forgotten.

## Mapping the system around an app idea

Before you write a spec or a prompt, spend ten minutes on a system map. A table is enough:

| Part | Question to answer | Yoga studio example |
|---|---|---|
| Users | Who uses it, and what does each need? | Members book; owner views the day's list |
| Data | What is stored, where, how sensitive? | Name, email, class; no health notes in version one |
| Integrations | What else does it talk to? | Confirmation email only |
| Hosting | Where does it run, who pays? | A simple host on a free or low-cost plan |
| Maintenance | Who changes it and fixes it? | Owner edits timetable; a named freelancer fixes code |
| Feedback | How will you hear about problems? | A "report a problem" link and a weekly check |
| Failure | What if it is down for a day? | Members phone the studio; owner keeps a paper list |

Notice the decision in the data row: leaving out health notes removes a whole category of risk. Systems thinking often leads you to build **less**, and that is a good outcome.

## Let the AI help you see the system

\`\`\`try
I am planning a small app: [a booking page for a yoga studio with about 60 members].

Do not write code. Map the system around it:
- users and what each needs
- data stored, where, and how sensitive it is
- other services it depends on
- where it would be hosted and who pays
- who maintains it and who fixes it if it breaks at 2am
- how problems would be reported
- what happens if it is down for a day

Then name the two riskiest parts and suggest how to make version one simpler.
\`\`\`

Read the answer critically. The AI does not know your users, your budget or your colleagues. Treat its map as a first draft for you to correct.

## Try it now

Pick one app idea you actually want to build; you will carry it through this track. Run the prompt above with your idea in the brackets, then rewrite the output as your own seven-row table.

You are done when every row has an answer in your own words, at least one row makes version one simpler, and you have named who fixes it at 2am (even if the answer is "me, and I need to learn how").`,
        microCheck: [
          {
            question: "A founder says their app is nearly finished because the AI has written all the code. What does a systems view suggest?",
            options: [
              "The code should be rewritten by hand before launching",
              "Users, data, hosting and upkeep may still be undecided",
              "The app is finished once the code passes a quick demo",
              "Only the database design is left, as that is the hard part",
            ],
            correctIndex: 1,
            explanation:
              "The code is usually the smallest part of the system. Who uses it, what data it holds, where it runs and who maintains it can all still be open questions, and those are where launches go wrong.",
          },
          {
            question: "Why is technical debt described as a reinforcing loop?",
            options: [
              "Paying debt off once removes it permanently from the project",
              "Users report bugs, and the fixes keep the product on course",
              "It grows at a fixed rate no matter how the team works",
              "More debt slows changes, which leads to more rushed shortcuts",
            ],
            correctIndex: 3,
            explanation:
              "A reinforcing loop feeds itself: shortcuts make later changes harder, which encourages more shortcuts. The user-feedback option describes a balancing loop instead, which pulls the product back towards what people need.",
          },
          {
            question: "On a system map for a class booking page, the owner decides not to collect health notes in version one. Why is that a good systems decision?",
            options: [
              "It removes a sensitive data risk the app does not yet need",
              "Health notes are too large to store in a simple database",
              "AI tools cannot write code that handles health information",
              "It makes the page load faster for members on their phones",
            ],
            correctIndex: 0,
            explanation:
              "Every piece of data you store brings duties and risk, and health data is especially sensitive. If version one does not need it, leaving it out removes a whole category of harm. Size, speed and tool limits are not the issue.",
          },
          {
            question: "What is the point of asking \"who fixes it at 2am?\" early in a project?",
            options: [
              "It decides which hosting company offers the best night support",
              "It tells you whether the app needs to run all night at all",
              "It exposes whether anyone can maintain the app when it breaks",
              "It checks that the AI tool will be available outside office hours",
            ],
            correctIndex: 2,
            explanation:
              "The question tests maintenance and ownership: who notices, who is told and who can actually fix it. For many vibe-coded apps the answer is nobody, which is cheap to discover early and expensive to discover late.",
          },
        ],
      },
      {
        title: "Your toolkit: chat assistants, code editors, agents and app builders",
        objective: "Choose the right category of AI coding tool for a task, based on what each category is good and bad at.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Four kinds of tool

AI coding tools change quickly. Names, features and prices shift every few months, so this lesson teaches **categories**, which change slowly. At the time of writing (September 2026), most tools fall into four groups. Examples are given only to help you recognise each category. Check current features, limits and prices before you commit to any of them.

## 1. Chat assistants

General AI assistants in a chat window, for example ChatGPT, Claude or Gemini. You describe a problem, the assistant replies with an explanation and code, and you copy the code somewhere to run it.

- **Good at:** explaining code, planning, writing a spec, answering "why does this error happen?", producing a single small file.
- **Weak at:** anything spread across many files. It cannot see your project unless you paste it in, and copying code back and forth invites mistakes.

## 2. AI code editors

A code editor with AI built in, for example Cursor, or Visual Studio Code with GitHub Copilot. The AI can see the files in your project, suggest changes as you type, and edit several files when asked.

- **Good at:** everyday work on a real project, showing each change as a **diff** (a view of exactly which lines were added and removed) so you can accept or reject it.
- **Weak at:** protecting you from yourself. Accepting every suggestion without reading the diff is vibe coding with extra steps.

## 3. Coding agents

Tools that take a task and carry it out over many steps: reading files, running commands, running tests and fixing what fails. For example Claude Code, OpenAI's Codex, or the agent modes inside AI editors. Some run in your **terminal** (the text window where you type commands), some in the cloud.

- **Good at:** well-defined tasks with a clear finish line, such as "add input validation to this form and make the checks pass".
- **Weak at:** vague tasks. An agent told to "make the app better" can change dozens of files in ways you did not want. It needs a spec, small tasks and version control so you can undo.

## 4. App builders

Web platforms where you describe an app and get a running, hosted version, for example Lovable, Bolt, Replit or v0. Many handle hosting, logins and a database for you.

- **Good at:** getting from idea to a clickable, shareable prototype in an afternoon.
- **Weak at:** control and exit. The code may be hard to move elsewhere, the database and logins may be tied to that platform, and costs can grow with use. Check whether you can export your code and your data.

## Comparing them

| Category | Sees your project? | Runs code for you? | Best first use |
|---|---|---|---|
| Chat assistant | Only what you paste | Sometimes, in a sandbox | Plan, spec, explain, small files |
| AI code editor | Yes | Some can | Everyday building on a real project |
| Coding agent | Yes | Yes | Clear, bounded tasks with checks |
| App builder | Yes, and hosts it | Yes | Fast prototypes and demos |

## Choosing for the job

Engineers pick tools for the task, not out of loyalty. A sensible pattern for most small projects:

1. Use a **chat assistant** to think: system map, spec, open questions.
2. Build in an **AI code editor** or with a **coding agent**, one small step at a time, with Git as your undo button.
3. Use an **app builder** when speed to a demo matters more than long-term control, and decide early whether the prototype will be rebuilt properly later.

Go back to your system map from the last lesson. The hosting and maintenance rows often decide the tool. If a freelancer will maintain the app, code they can open in a normal editor matters more than how fast the first version appeared.

Whatever you use, the habits in this track stay the same: a spec, small steps, reading changes, version control, checks and care with data. The tool changes how fast the typing happens. It does not change what good work looks like.

This course also has a built-in **Code Studio**, which you will meet in the next lesson. It is a safe place to practise these habits before choosing tools of your own.

## Ask for a comparison, with reasons

\`\`\`try
I want to build: [a page where my team logs weekly sales calls and sees a simple chart].
My experience: [I can write spreadsheet formulas but have never coded].
My budget: [free, or a small monthly amount].
Who will maintain it: [me, possibly a freelancer later].

Compare four categories of AI coding tool for this: chat assistant, AI code editor, coding agent, app builder.
For each, give: what it would be good at here, the main risk, and what I would need to learn.
Do not recommend specific products. Finish with the category you would start with, and why.
\`\`\`

## Try it now

Run the prompt with your own project, experience and budget. You are done when you have chosen a category for your first build and written one sentence on the main risk of that choice and how you will manage it.`,
        microCheck: [
          {
            question: "You want a coding agent to improve your app. Which task is it most likely to handle well?",
            options: [
              "Make the whole app feel more modern and professional",
              "Look through the project and fix anything that seems wrong",
              "Add validation to the signup form so the three checks pass",
              "Improve performance and design wherever you think it helps",
            ],
            correctIndex: 2,
            explanation:
              "Agents do best with bounded tasks that have a clear finish line, such as named checks to pass. Open-ended requests invite the agent to change many files in ways you did not ask for.",
          },
          {
            question: "An app builder got your prototype live in an afternoon. What should you check before real customers rely on it?",
            options: [
              "Whether you can export your code and data if you need to leave",
              "Whether the platform used the newest AI model for the build",
              "Whether the prototype has more features than a hand-coded one",
              "Whether the chat history with the builder is saved somewhere",
            ],
            correctIndex: 0,
            explanation:
              "App builders are fast but can tie your code, database and logins to one platform. Knowing you can export is what keeps you in control of cost and your future options. The model version matters far less.",
          },
          {
            question: "Why does this lesson teach tool categories rather than recommending specific products?",
            options: [
              "Specific products are not allowed to be mentioned in a course",
              "All products in a category behave identically, so names are noise",
              "Categories are cheaper to use than any branded product",
              "Products, features and prices change faster than categories do",
            ],
            correctIndex: 3,
            explanation:
              "Tool names and prices shift every few months, while the strengths and weaknesses of each category are stable. The lesson does name examples, but says to check current details before committing.",
          },
          {
            question: "A colleague accepts every change an AI code editor suggests without looking at the diff. What is the problem?",
            options: [
              "Code editors only work properly when each change is typed out by hand",
              "They lose the editor's main safeguard: seeing exactly what changed",
              "The editor will stop making suggestions after too many accepts",
              "Accepting changes quickly makes the AI's code run more slowly",
            ],
            correctIndex: 1,
            explanation:
              "The diff is where you spot unrequested or risky changes. Skipping it turns a professional tool back into vibe coding. The editor does not stop working or slow down because you accept changes quickly.",
          },
        ],
      },
      {
        title: "Your first build: HTML, CSS and JavaScript in ten minutes",
        objective: "Read and edit a simple web page's HTML, CSS and JavaScript well enough to follow and check what an AI writes.",
        durationMinutes: 28,
        contentType: "article",
        resources: [
          {
            title: "MDN Learn web development",
            url: "https://developer.mozilla.org/en-US/docs/Learn",
            resourceType: "article",
            isFree: true,
            notes: "Free, well-maintained beginner guides to HTML, CSS and JavaScript.",
          },
        ],
        bodyMd: `## Why you need to read a little code

You do not need to become a programmer to build with AI. You do need to read code well enough to notice when something is wrong, to describe what you want changed, and to check what the AI changed. For small web apps that means three languages, each with one job:

- **HTML** says what is on the page: headings, text, buttons, inputs.
- **CSS** says how it looks: colours, sizes, spacing, layout.
- **JavaScript** says what it does: what happens when you click, type or load the page.

## HTML: the structure

Here is a complete page. Edit the text in the box and watch the preview change. Try changing the heading, or adding a third list item.

\`\`\`playground
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Lunch order</title>
</head>
<body>
  <h1>Team lunch order</h1>
  <p>Add your order before 11am.</p>
  <ul>
    <li>Soup of the day</li>
    <li>Falafel wrap</li>
  </ul>
</body>
</html>
\`\`\`

Things to notice:

- Content sits inside **tags** such as \`<h1>\` and \`</h1>\`. The first opens, the second (with a slash) closes.
- \`<h1>\` is a main heading, \`<p>\` a paragraph, \`<ul>\` a list and \`<li>\` a list item.
- The \`<head>\` holds information about the page; the \`<body>\` holds what you see.

## CSS and JavaScript: looks and behaviour

This page adds a \`<style>\` block (CSS) and a \`<script>\` block (JavaScript). Click the button in the preview, then try the changes listed below.

\`\`\`playground
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: sans-serif; padding: 16px; }
  button { background: #2563eb; color: white; border: 0; padding: 8px 16px; border-radius: 6px; }
  #count { font-size: 32px; font-weight: bold; }
</style>
</head>
<body>
  <h1>Cups of tea today</h1>
  <p id="count">0</p>
  <button id="add">Add a cup</button>
  <script>
    let cups = 0;
    const countEl = document.getElementById('count');
    const button = document.getElementById('add');
    button.addEventListener('click', function () {
      cups = cups + 1;
      countEl.textContent = cups;
    });
  </script>
</body>
</html>
\`\`\`

Try these, one at a time:

1. Change \`#2563eb\` to \`green\`. That is CSS changing a colour.
2. Change \`cups + 1\` to \`cups + 2\`. That is JavaScript changing behaviour.
3. Change \`id="add"\` to \`id="plus"\` in the HTML only, then click the button. It stops working.

The third change is the most important lesson here. Parts of a page are **connected by names**. An **id** is a unique name for one element, and JavaScript uses it to find that element. The script still looks for \`add\` and finds nothing. When an AI renames something in one place and not the other, this is exactly the bug you get. Change it back and the button works again.

## Reading JavaScript line by line

- \`let cups = 0;\` creates a **variable** (a named box holding a value) and puts 0 in it.
- \`document.getElementById('count')\` finds the element whose id is \`count\`.
- \`addEventListener('click', function () { ... })\` means: when this button is clicked, run the code inside the curly braces.
- \`countEl.textContent = cups;\` puts the current number on the page.

You can now read the skeleton of most small web apps. Bigger apps spread this across more files and add frameworks, but they are built from the same ideas: elements, names, events and changes to the page.

## The Code Studio

This course includes a built-in **Code Studio** for its practical labs. It has four parts:

- an **editor**, where you write or change the code
- a **live preview**, which shows the page as you edit
- an **AI pair programmer**, which you can ask to explain, suggest or change code
- **automated checks**, small tests that run against your page and tell you what passes and what does not

Each lab brief tells you which ids to use, such as \`add\` or \`count\` above, because that is how the checks find your elements. Treat the AI pair programmer as a colleague, not an autopilot: ask for one change at a time and read what it did.

## Ask the AI to teach you, not just to build

\`\`\`try
Explain this code to someone who has never programmed. Go line by line, in plain English.
Then tell me exactly which lines I would change to [make the button subtract instead of add].

[PASTE THE CODE HERE]
\`\`\`

## Try it now

In the second playground, make the page count something from your own day, with two buttons: one that adds and one that resets the count to zero. Give the reset button the id \`reset\`. Use the practice pad if you get stuck, but make each change yourself.

You are done when both buttons work in the preview and you can point to the line that sets the number back to 0.`,
        microCheck: [
          {
            question: "An AI changes a button's id from \"save\" to \"submit\" in the HTML, and now clicking it does nothing. What is the most likely cause?",
            options: [
              "Buttons with the id \"submit\" are blocked by most web browsers",
              "The JavaScript still looks for the old id and finds nothing",
              "The CSS no longer styles the button, so clicks are ignored",
              "The page needs to be rebuilt by the AI after any id change",
            ],
            correctIndex: 1,
            explanation:
              "JavaScript finds elements by name, usually their id. Renaming it in one place but not the other breaks the connection. Styling does not affect whether clicks run code, and no rebuild is needed.",
          },
          {
            question: "You want the counter button to be green instead of blue. Which part of the page do you change?",
            options: [
              "The HTML tag for the button, which controls its colour",
              "The JavaScript listener, which sets the colours on each click",
              "The page title in the head, which sets the colour theme",
              "The CSS in the style block, which controls how things look",
            ],
            correctIndex: 3,
            explanation:
              "CSS controls appearance such as colours, sizes and spacing. HTML says what is on the page and JavaScript says what it does. Knowing which language owns which job tells you where to look in AI-written code.",
          },
          {
            question: "In the counter page, what does the line countEl.textContent = cups; do?",
            options: [
              "Shows the current value of cups inside the count element",
              "Adds one to the number of cups each time it is run",
              "Finds the element on the page whose id is count",
              "Stores the number of cups so that it survives a page refresh",
            ],
            correctIndex: 0,
            explanation:
              "The line writes the variable's value into the element on the page. Adding one happens on the line before, finding the element happens earlier with getElementById, and nothing here saves data across refreshes.",
          },
          {
            question: "In the Code Studio, why does a lab brief tell you which element ids to use?",
            options: [
              "The AI pair programmer only understands those exact names",
              "Browsers need standard ids to display the preview",
              "The automated checks find your elements by those ids",
              "Other ids would make the page look different in CSS",
            ],
            correctIndex: 2,
            explanation:
              "Automated checks run against your live page and locate elements by id, just as your own JavaScript does. Browsers and the AI pair programmer accept any valid id; the checks are what depend on the agreed names.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A manager asks you to vibe code a quick mock-up of a new dashboard to show at Friday's meeting. It will use made-up data and be thrown away afterwards. What is the sensible approach?",
        options: [
          "Write a full spec with acceptance criteria before any AI prompting",
          "Refuse, since code you have not reviewed should never be shown",
          "Build it fast with AI and skip heavy process, as failure is cheap",
          "Build it by hand so the mock-up does not depend on any AI tool",
        ],
        correctIndex: 2,
        explanation:
          "Matching effort to risk is part of the engineer's mindset. A throwaway mock-up with fake data is exactly where vibe coding shines. The process in this track matters once real people, real data or ongoing changes are involved.",
      },
      {
        question: "Three months after a quick launch, every small change to a team's AI-built app seems to break something else, so they rush fixes, which break more. Which systems idea best describes this?",
        options: [
          "A reinforcing loop of technical debt that speeds up over time",
          "A balancing loop that will settle down once users adjust",
          "A bottleneck at the hosting provider slowing every release",
          "A one-off event caused by a single bad AI suggestion",
        ],
        correctIndex: 0,
        explanation:
          "Shortcuts make changes harder, which encourages more shortcuts: a reinforcing loop. It will not settle by itself, and treating it as a one-off event hides the structure that keeps producing the problem.",
      },
      {
        question: "Why do the costs of vibe coding often surprise people weeks after launch rather than on day one?",
        options: [
          "AI-written code slowly degrades on the server after deployment",
          "Hosting companies raise prices for AI-built apps after a month",
          "Early users are too polite to report bugs in the first weeks",
          "There is a delay between taking a shortcut and feeling its cost",
        ],
        correctIndex: 3,
        explanation:
          "Delays separate cause and effect: the shortcut feels free when taken, and the maintenance, security or data cost arrives later. Code does not decay on its own, and hosting is not priced by who wrote the code.",
      },
      {
        question: "You are mapping the system around a volunteer rota app for a charity. Which row is the AI least able to fill in for you?",
        options: [
          "How a simple web page could list volunteer shifts",
          "Who maintains it and who is called when it breaks",
          "What a typical rota table might look like on screen",
          "Which fields a volunteer sign-up form could contain",
        ],
        correctIndex: 1,
        explanation:
          "Maintenance and ownership depend on your people, budget and commitments, which the AI cannot know. It can draft screens, tables and forms, but only you can decide who will look after the app.",
      },
      {
        question: "A small clinic wants a vibe-coded form that collects patients' symptoms before appointments. Which failure point should worry them most?",
        options: [
          "Scale: the form may slow down if many patients use it at once",
          "Data: sensitive personal information with legal duties attached",
          "Hand-off: a new receptionist may not like the form's layout",
          "Styling: the AI might pick colours that clash with the brand",
        ],
        correctIndex: 1,
        explanation:
          "Health information is highly sensitive, and leaking or losing it causes real harm and legal trouble. A vibe-coded form may have no access control or backups. Scale and styling are minor by comparison for a single clinic.",
      },
      {
        question: "You need to add input validation across four files in an existing project, with checks that tell you when it is done. Which tool category fits best?",
        options: [
          "An app builder, starting the whole project again from scratch",
          "A chat assistant, pasting each file in and out by hand",
          "No AI tool, since multi-file changes are too risky to delegate",
          "A coding agent or AI editor, given the task and the checks",
        ],
        correctIndex: 3,
        explanation:
          "Tools that can see your project handle multi-file changes well, especially with a clear finish line such as passing checks. Copying four files in and out of a chat invites mistakes, and rebuilding from scratch throws away working code.",
      },
      {
        question: "A founder built a customer portal on an app builder. Customers now rely on it, and the platform announces a large price rise. What should they have checked earlier?",
        options: [
          "Whether code and data could be exported to run elsewhere",
          "Whether the builder used the most capable AI model available",
          "Whether the portal had more features than competitors' portals",
          "Whether the platform offered a free trial for new projects",
        ],
        correctIndex: 0,
        explanation:
          "App builders trade control for speed. Being able to export code and data is what keeps you able to leave if prices or terms change. The model used or the feature count does not help once you are locked in.",
      },
      {
        question: "You paste an AI-written page into the preview. The button shows up, but clicking it does nothing, and you notice the script looks for getElementById('send') while the button has id=\"submit\". What should you do?",
        options: [
          "Add more CSS so the button is visibly clickable to the user",
          "Ask the AI to rewrite the whole page from the beginning",
          "Make the two names match, so the script can find the button",
          "Move the script to the top of the page so it runs first",
        ],
        correctIndex: 2,
        explanation:
          "The script and the HTML are connected by the id. When they disagree, the script finds nothing and the click does nothing. The fix is one name, not a rewrite, and styling or moving the script does not reconnect them.",
      },
      {
        question: "A junior analyst says: \"I do not need to read any code, because the AI understands it for me.\" What is the strongest reply?",
        options: [
          "You must learn to write it all by hand before using AI at all",
          "You are right, as long as the AI explains every change it makes",
          "You need enough to spot problems and check what the AI changed",
          "You only need to read code if the app is going to be public",
        ],
        correctIndex: 2,
        explanation:
          "Reading a little code is what lets you notice renamed ids, unrequested changes and risky additions. You do not need to write everything by hand, and an AI's explanation of its own change can be confidently wrong.",
      },
      {
        question: "Your system map for a sign-up page shows the only person who can fix the code is a contractor whose contract ends next month. What is the best response?",
        options: [
          "Plan the hand-off now: a spec, change history and a named owner",
          "Launch anyway, since the AI can fix any problem that comes up",
          "Ask the contractor to add more features before they leave",
          "Rebuild the page on a different tool so the problem goes away",
        ],
        correctIndex: 0,
        explanation:
          "The map has exposed a maintenance gap, and it is cheaper to close it now. A spec, a version history and a named owner give whoever comes next a fighting chance. Adding features or switching tools makes the gap worse.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 2
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Specs Before Prompts",
    summary:
      "Turn an idea into something an AI can build reliably: user stories with Given/When/Then acceptance criteria, small vertical slices, a one-page spec, and a deliberately simple stack and data model.",
    lessons: [
      {
        title: "Requirements, user stories and acceptance criteria",
        objective: "Write user stories with Given/When/Then acceptance criteria that make \"done\" testable, including edge cases.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Why "build me an app" goes wrong

When you ask an AI to build something vague, it fills every gap with a guess. Sometimes the guesses are good. Often they are not what you meant, and you only find out after a lot of back and forth. Engineers reduce guessing by writing **requirements**: plain statements of what the software must do.

You do not need a heavy document. Two light tools do most of the work: user stories and acceptance criteria.

## User stories

A user story describes one thing a person wants to do, and why, in one sentence:

> As a **[type of user]**, I want to **[do something]**, so that **[I get some benefit]**.

Examples for a bill-splitting page used by friends at a restaurant table:

- As a diner, I want to enter the total bill and the number of people, so that I know what each person owes.
- As a diner, I want to add a tip percentage, so that the tip is shared fairly.
- As a diner, I want amounts shown to the penny, so that I can pay the exact figure by card.

Each story is small, is about a real person, and states a purpose. The "so that" part matters: it tells you (and the AI) which trade-offs are acceptable. If you cannot write a clear benefit, question whether you need the story at all.

## Acceptance criteria: Given, When, Then

A story says what someone wants. **Acceptance criteria** say how you will know it works. A widely used format is Given/When/Then:

- **Given** the starting situation
- **When** the user does something
- **Then** this is the result you can see

For the first story:

\`\`\`text
Story: As a diner, I want to enter the total bill and the number of
people, so that I know what each person owes.

Criterion 1
Given the bill is 90.00 and there are 3 people
When I press Split
Then I see "Each person pays 30.00"

Criterion 2
Given the number of people is 0 or empty
When I press Split
Then I see "Enter at least 1 person" and no amount is shown

Criterion 3
Given the bill is 100.00 and there are 3 people
When I press Split
Then I see "Each person pays 33.34" (rounded up so the bill is covered)
\`\`\`

Look at what this forces you to decide. What happens with zero people? Which way do you round? Without criteria, the AI decides these for you, silently, and may decide differently next time. With criteria, you decide once, and every future check uses the same answers.

## Edge cases are where bugs live

An **edge case** is an unusual but possible input: zero, empty, negative, very large, letters where a number should be, the same button pressed twice. Many real bugs live there, not on the "happy path" where everything is typed correctly.

A quick checklist for any input:

- What if it is empty?
- What if it is zero or negative?
- What if it is huge?
- What if it is the wrong type, such as letters in a number field?
- What if the user does it twice, quickly?

You do not need a criterion for every case. You do need to have thought about them and decided which ones matter for your users.

## Criteria become tests

Acceptance criteria are not paperwork. They are the checklist you run after every change, and later they become **automated tests**: small programs that check the criteria for you. The Code Studio checks you meet in the labs are exactly this, Given/When/Then criteria turned into code.

They also help with hand-off, the failure point from Module 1. Someone taking over your app can read the criteria and know what "working" means without asking you.

Try it on a small app: lay out the to-do screen below and watch the tool turn it into user stories and Given/When/Then criteria.

\`\`\`studio
wireframe-builder:todo-empty
\`\`\`

## Let the AI find the gaps

\`\`\`try
Here is a user story for an app I am building:

"As a [diner], I want to [split a restaurant bill between friends], so that [everyone knows what they owe]."

Write 5 acceptance criteria in Given/When/Then format. Include at least 2 edge cases (empty, zero, negative or silly inputs).
Then list, as questions, any decisions I need to make that the story does not answer.
\`\`\`

The questions at the end are often the most valuable part. Answer them yourself; do not let the AI choose for you.

## Try it now

Take the app idea you mapped in Module 1. Write three user stories for it, then run the prompt above for the most important one. Edit the AI's criteria so that every "Then" line describes something you could see on the screen.

You are done when you have one story with at least four criteria, including two edge cases, and you have written your own answer to every open question the AI raised.`,
        microCheck: [
          {
            question: "Which of these is a well-formed acceptance criterion?",
            options: [
              "The split feature should work correctly for all reasonable user inputs",
              "As a diner, I want to split the bill so that everyone pays fairly",
              "When the bill is entered the system handles the calculation well",
              "Given 2 people and a 50.00 bill, when I press Split, then I see 25.00",
            ],
            correctIndex: 3,
            explanation:
              "A good criterion names a concrete starting point, an action and a visible result you can check. \"Work correctly\" and \"handles it well\" cannot be tested, and the \"As a diner\" line is a user story, not a criterion.",
          },
          {
            question: "Why does the \"so that\" part of a user story matter when building with AI?",
            options: [
              "It tells the AI which programming language it should be using",
              "It states the purpose, which guides trade-offs the AI will make",
              "It is required by AI tools before they will generate any code",
              "It sets the order in which all of the app's features have to be built",
            ],
            correctIndex: 1,
            explanation:
              "The benefit explains why the feature exists, so you and the AI can judge which shortcuts are acceptable. It says nothing about language or build order, and tools do not require it; it is there for clear thinking.",
          },
          {
            question: "A bill splitter works perfectly when you type sensible numbers. What should you test next?",
            options: [
              "The same sensible numbers again on a different browser",
              "Edge cases such as zero people, an empty bill or letters",
              "Larger sensible numbers, in case the maths changes with size",
              "Nothing more, as the happy path is what users will follow",
            ],
            correctIndex: 1,
            explanation:
              "Many bugs live in unusual but possible inputs, not on the happy path. Repeating sensible inputs mostly confirms what you already know, while empty, zero or wrong-type inputs find the gaps.",
          },
          {
            question: "Without acceptance criteria, how does an AI usually handle a question like \"how should amounts be rounded?\"",
            options: [
              "It refuses to write the code until you give it a rounding rule",
              "It always uses the rounding rule that is standard in banking and finance",
              "It asks you, because rounding is a well-known edge case",
              "It picks an answer silently, and may pick differently next time",
            ],
            correctIndex: 3,
            explanation:
              "AI tools fill gaps with guesses rather than stopping to ask, and those guesses can change between sessions. Writing the rule into a criterion makes the decision yours and keeps it consistent.",
          },
          {
            question: "How do acceptance criteria help with the hand-off failure point from Module 1?",
            options: [
              "They tell the next person exactly what \"working\" means",
              "They stop anyone else from changing the code in future",
              "They record who wrote each line of code in the project",
              "They replace the need for any version control history",
            ],
            correctIndex: 0,
            explanation:
              "Someone taking over can read the criteria and check the app against them without guessing your intentions. Criteria do not lock the code, track authorship or replace a history of changes.",
          },
        ],
      },
      {
        title: "Breaking work into small, testable steps",
        objective: "Split an app into thin vertical slices that can each be built, checked and saved in one short session.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## Big prompts produce big messes

Ask an AI for a whole app in one go and you get a lot of code at once. Some of it works and some does not, and because everything arrived together you cannot tell which part caused which problem. Fixing one thing breaks another. This is one of the most common ways vibe-coded projects stall.

Engineers avoid it by working in **small steps**, each small enough to check fully before the next begins. A rule of thumb: if you cannot describe how to check a step in one or two sentences, it is too big.

## Layers versus slices

There are two ways to cut up work.

**Horizontal layers** build one technical layer at a time: first all the data storage, then all the logic, then all the screens. Nothing works for a user until the very end, so problems surface late, when they are expensive.

**Vertical slices** build one thin piece of user value at a time, through every layer it needs. After each slice, someone can use something real, however small.

Think of a cake. Layers means baking all the sponge, then making all the filling, then all the icing. A slice is one thin piece with a bit of everything, which you can actually taste.

## A worked example: a habit tracker

Imagine a simple page where you tick off daily habits. Sliced vertically:

| # | Slice | How to check it |
|---|---|---|
| 1 | Show a fixed list of three habits | Page loads and shows the three names |
| 2 | Tick a habit as done today | Clicking shows a tick; clicking again removes it |
| 3 | Remember ticks after a refresh | Tick one, refresh, the tick is still there |
| 4 | Add a new habit | Type a name, press Add, it appears in the list |
| 5 | Reject empty habit names | Add with an empty box shows a message, adds nothing |
| 6 | Show a streak count | Tick a habit three days running, streak shows 3 |

Notice the order. Slice 1 is almost trivially small on purpose: it proves the page, the setup and the preview all work before any logic exists. A first end-to-end slice like this is often called a **walking skeleton**. Slice 3 (saving data) comes before slice 4 because saving is the riskiest technical part, and it is better to find trouble there early. Slice 6 is last because it is the most complex and the least essential.

## What makes a good step

A good step is:

- **Small**: one feature or one fix, usually a few minutes of AI work.
- **Testable**: it has a clear check, ideally one of your acceptance criteria.
- **Complete**: it works on its own, so you can save it and stop there.
- **Valuable or de-risking**: it adds something a user can see, or it answers a risky question early.

Be wary of steps like "set up the backend" or "improve the design". Neither has a clear finish line, so neither can be checked.

## Order by risk and value

When deciding what comes next, ask two questions. What is the riskiest thing I have not proved yet? What is the most valuable thing a user cannot yet do? Do the risky things early, while changes are cheap. Leave polish (colours, animations, nice-to-have features) until the core works.

This is systems thinking applied to your own build. Each slice closes a feedback loop: build, check, learn. Small slices mean short loops and small mistakes. One giant step is one very long loop, with all the learning arriving at the end, when it is most expensive to act on.

## Get the AI to slice, then edit its plan

\`\`\`try
I am building: [a habit tracker web page where I tick off daily habits].
Here are my user stories:
[PASTE YOUR USER STORIES]

Break this into 5 to 8 vertical slices. For each slice give:
- what the user can do after it
- one sentence on how I check it works
- why it comes at that point in the order

The first slice must be the smallest possible thing that runs end to end. Put the riskiest technical part early.
\`\`\`

Check the AI's slices against the "good step" list. It often proposes slices that are really layers, such as "build the interface" or "create the database". Split those until each one has a one-sentence check.

## Try it now

Run the prompt for your own app, using the user stories you wrote in the last lesson. Edit the result until every slice has a one-sentence check.

You are done when you have a numbered list of at least five slices, the first one is trivially small, and you can say in one sentence why the riskiest slice sits where it does.`,
        microCheck: [
          {
            question: "Which of these is a vertical slice rather than a horizontal layer?",
            options: [
              "Design every database table the finished app will need",
              "Write all of the page styling before any features exist",
              "Let a user add one expense and see it appear in the list",
              "Build every screen first, then connect them all to the data",
            ],
            correctIndex: 2,
            explanation:
              "A vertical slice delivers something a user can do, going through every layer it needs. Building all the tables, all the styling or all the screens first are layers, and nothing works for a user until they all meet.",
          },
          {
            question: "Why should the first slice be almost trivially small?",
            options: [
              "Small first slices make AI tools charge less for later work",
              "Users expect to see the simplest features before the hard ones",
              "It proves the setup and preview work before any logic exists",
              "The first slice is thrown away, so effort on it is wasted",
            ],
            correctIndex: 2,
            explanation:
              "A walking skeleton checks that the whole path runs end to end, so later problems are about features, not setup. It is kept and built on, and ordering is about risk, not what users expect to see first.",
          },
          {
            question: "Your plan has a step called \"improve the design\". What is the problem with it?",
            options: [
              "It has no clear finish line, so you cannot check it is done",
              "Design work should always be done by a professional designer",
              "AI tools are not able to make changes to how a page looks",
              "Design must always be finished before any feature is built",
            ],
            correctIndex: 0,
            explanation:
              "A good step can be checked in a sentence or two. \"Improve the design\" could mean anything, so the AI may change a lot and you cannot tell when it is finished. Split it into specific, checkable changes.",
          },
          {
            question: "In the habit tracker plan, why does saving ticks after a refresh come before adding new habits?",
            options: [
              "Adding habits cannot be built until ticks are saved first",
              "Users care more about saving than about adding new habits",
              "Saving takes the least time, so it is quickest to do first",
              "Saving is the riskiest technical part, so it is proved early",
            ],
            correctIndex: 3,
            explanation:
              "Order by risk and value: the riskiest unproved part goes early, while changes are cheap. Adding a habit could technically come first, and the order is not about which step is quickest.",
          },
        ],
      },
      {
        title: "Writing a spec an AI can build from",
        objective: "Write a one-page spec with context, stack, features, constraints, examples, non-goals and a definition of done.",
        durationMinutes: 27,
        contentType: "article",
        bodyMd: `## A spec is a prompt that lasts

A **spec** (short for specification) is a short document that says what you are building, for whom, with what, and how you will know it is done. It does two jobs. It forces you to decide things before the AI guesses them, and it becomes reusable context: you paste it at the start of every AI session, give it to a coding agent, or hand it to a person who takes over.

A spec for a small app fits on one page. Longer is not better; clearer is.

## The seven parts

1. **Context**: what the app is for, who uses it and in what situation.
2. **Stack**: the technology to use, for example "a single HTML file with inline CSS and JavaScript, no frameworks".
3. **Features**: your user stories, in slice order.
4. **Constraints**: rules the code must follow, such as ids, accessibility, browsers, no external services, how data is stored.
5. **Examples**: concrete inputs and expected outputs. These are worth more than paragraphs of description.
6. **Non-goals**: what you are deliberately not building. AI tools like to add features; non-goals fence them off.
7. **Definition of done**: the checks that must all pass before a slice counts as finished.

## A full sample spec

\`\`\`text
SPEC: Bill Splitter (version 1)

Context
A page friends use at a restaurant table to split a bill. Used on
phones, often in a hurry. No accounts, no saved history.

Stack
One HTML file with inline CSS and JavaScript. No frameworks, no
external scripts, no network calls.

Features (build in this order)
1. Enter bill total and number of people, press Split, see amount each.
2. Optional tip percentage (0 to 30), added before splitting.
3. Clear button resets every field and the result.

Constraints
- Element ids: bill, people, tip, split, clear, result.
- Show amounts to 2 decimal places. Round each share UP to the penny.
- Every input has a visible label. Buttons at least 44px tall.
- Show errors in the result area, never as pop-up alerts.

Examples
bill 90,  people 3, tip 0   -> "Each person pays 30.00"
bill 100, people 3, tip 0   -> "Each person pays 33.34"
bill 80,  people 4, tip 10  -> "Each person pays 22.00"
people 0 or empty           -> "Enter at least 1 person"

Non-goals (version 1)
- No currency conversion, no uneven splits, no saving or sharing.

Definition of done (every feature)
- All examples above still give the stated result.
- No errors in the browser console.
- Works at phone width (375px) with no sideways scrolling.
- Committed to Git with a clear message.
\`\`\`

Check the third example yourself: 80 plus 10% is 88, divided by 4 is 22.00. Worked examples like this also catch arithmetic mistakes in AI-written code.

## Why each part earns its place

- **Stack** stops the AI reaching for a framework you cannot maintain.
- **Ids in the constraints** make automated checks possible and prevent the renaming bug you saw in Module 1.
- **Examples** turn fuzzy words like "split fairly" into exact expectations.
- **Non-goals** protect you from **scope creep**: the project quietly growing beyond what you planned.
- **Definition of done** makes "finished" a checklist rather than a feeling.

The spec also connects back to your system map. The context section is the users row; the constraints and non-goals often come straight from the data and hosting rows.

Sketch a login flow below, link the screens together, and copy the prompt the tool writes from your wireframe.

\`\`\`studio
wireframe-builder:login-forgot
\`\`\`

## From vague idea to spec

You do not have to write the spec alone. Use the AI as an interviewer, then edit hard.

\`\`\`try
I have a vague idea for a small app: [a page where my book club votes on next month's book].

Interview me to turn this into a one-page spec. Ask me ONE question at a time and wait for my answer before asking the next. Cover: context and users, stack (as simple as possible), features in build order, constraints, concrete examples of inputs and outputs, non-goals, and a definition of done.

When I say "write it up", produce the spec using exactly these headings:
Context, Stack, Features, Constraints, Examples, Non-goals, Definition of done.
\`\`\`

Asking for one question at a time matters. Given a free hand, the AI will often answer its own questions with assumptions and hand you a spec full of decisions you never made.

## Try it now

Run the interview prompt for your own app idea and answer honestly, including "I do not know yet" where that is true. When you have the spec, edit it yourself: add at least three concrete examples and at least two non-goals.

You are done when your spec has all seven headings, fits on one page, and a friend could read it and tell you what version one will and will not do.`,
        microCheck: [
          {
            question: "Your spec says \"split the bill fairly\". What would make it much more useful to an AI?",
            options: [
              "A longer paragraph explaining what fairness means to you",
              "Concrete examples, such as 100 split 3 ways shows 33.34",
              "The word \"fairly\" in capitals so the AI notices it",
              "A note asking the AI to use its best judgement on fairness",
            ],
            correctIndex: 1,
            explanation:
              "Examples turn a fuzzy word into an exact expectation that can be checked. More description or emphasis still leaves the AI to interpret, and asking for its judgement hands the decision back to it.",
          },
          {
            question: "What is the main job of the non-goals section?",
            options: [
              "To list features that are too hard for AI tools to build",
              "To stop the AI adding features you have not asked for",
              "To record features that users have requested and rejected",
              "To tell the AI which programming languages it cannot use",
            ],
            correctIndex: 1,
            explanation:
              "AI tools tend to add extras. Stating what version one deliberately leaves out fences off scope creep. It is not a list of things AI cannot do, and languages belong in the stack section.",
          },
          {
            question: "Why does the sample spec list the exact element ids in its constraints?",
            options: [
              "Because browsers require ids to be declared in advance",
              "So the page loads faster when each id is known upfront",
              "Because CSS cannot style elements whose ids are not listed",
              "So checks can find elements and the AI cannot rename them",
            ],
            correctIndex: 3,
            explanation:
              "Fixed ids let automated checks locate elements and stop the renaming bug from Module 1. Browsers, CSS and loading speed do not depend on ids being written in a spec.",
          },
          {
            question: "When using an AI to interview you for a spec, why ask for one question at a time?",
            options: [
              "Otherwise it tends to answer its own questions with guesses",
              "AI tools can only handle one question in each message",
              "It keeps the conversation short enough to fit the context",
              "Specs must be written in the same order as the questions",
            ],
            correctIndex: 0,
            explanation:
              "Given many questions at once, an AI often fills in the answers itself, handing you decisions you never made. Waiting for your reply keeps the decisions yours. Tools can handle several questions; that is not the issue.",
          },
        ],
      },
      {
        title: "Choosing a simple stack and a data model",
        objective: "Decide between a static page and a back end, and design a minimal data model that stores only what the app needs.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## Boring is a feature

The **stack** is the set of technologies an app is built with: languages, frameworks, database, hosting. AI tools will happily suggest impressive stacks. For a small app built by one person, that is usually a mistake.

Engineers often talk about choosing **boring technology**, a phrase popularised by Dan McKinley's essay "Choose Boring Technology". The idea: well-established tools have known problems, plenty of documentation and answers to almost every error message. Newer or more exotic tools bring surprises you must solve yourself. AI assistants also tend to be more reliable with widely used technology, because far more example code exists for it.

Every extra piece in your stack is something that can break, go out of date, or need someone who understands it. Ask for the fewest pieces that do the job.

## Static page or back end?

The biggest early decision is whether you need a **back end**: code running on a server you control.

A **static site** is just files (HTML, CSS, JavaScript) sent to the browser. All the logic runs on the user's device. It is cheap or free to host, fast, and offers very little to attack.

You need a back end, or a service acting as one, when:

- data must be **shared** between users (everyone sees the same bookings)
- data must be **protected** from the user (other people's emails, prices you control)
- you need **secrets**, such as an API key (a password that lets your code use another service), which must never be sent to the browser
- work must happen when nobody has the page open, such as a reminder email at 8am

| Situation | Is a static page enough? |
|---|---|
| Bill splitter used on one phone | Yes |
| Personal habit tracker on one device | Yes, saving in the browser |
| Book club vote that everyone can see | No, votes must be shared |
| Anything calling a paid AI service | No, the key must stay on a server |

If you are unsure, start static. Moving to a back end later is normal. Starting with one you do not need adds cost and risk from day one.

## Designing a data model

A **data model** describes what information your app stores and how the pieces relate. Write it down before you prompt, because changing it later touches everything.

Ask three questions of every piece of data:

1. **Do we need it?** If no feature uses it, do not store it.
2. **How sensitive is it?** Names and emails are personal data, with legal duties in many countries. Health or financial data is more sensitive still.
3. **Who can see and change it?**

A minimal model for the book club vote:

\`\`\`text
Book    id (unique), title (required), proposedBy (a member id)
Member  id (unique), name (first name only in version 1)
Vote    memberId, bookId
Rule    one vote per member per month
\`\`\`

Notice what is missing: no emails, no passwords, no surnames. Each thing you leave out is something you cannot leak. This is the data row of your system map turned into a design.

## See a data model in code

In JavaScript, a simple data model is often a list of objects. Edit the data below, add a book or change a vote, and watch the tally update.

\`\`\`playground
<!doctype html>
<html>
<body style="font-family: sans-serif; padding: 16px;">
  <h2>Book club vote</h2>
  <ul id="results"></ul>
  <script>
    const books = [
      { id: 'b1', title: 'The Remains of the Day' },
      { id: 'b2', title: 'Small Things Like These' }
    ];
    const votes = [
      { memberId: 'm1', bookId: 'b1' },
      { memberId: 'm2', bookId: 'b2' },
      { memberId: 'm3', bookId: 'b1' }
    ];
    const list = document.getElementById('results');
    books.forEach(function (book) {
      const count = votes.filter(function (v) { return v.bookId === book.id; }).length;
      const item = document.createElement('li');
      item.textContent = book.title + ': ' + count + ' votes';
      list.appendChild(item);
    });
  </script>
</body>
</html>
\`\`\`

Now change one vote's \`bookId\` to \`'b9'\`, a book that does not exist. The vote silently vanishes from the tally. Data that points at nothing is a classic bug, and a good reason to write the relationships down.

## Try it now

\`\`\`try
I am building: [PASTE THE CONTEXT AND FEATURES FROM YOUR SPEC].

1. Tell me whether this needs a back end or can be a static page, and name the deciding factor.
2. Propose the smallest data model that supports these features: entities, fields and relationships.
3. For each field, say how sensitive it is and whether I could drop it from version one.
Prefer the simplest, most widely used technology. Do not suggest paid services unless unavoidable.
\`\`\`

Run it with your own spec, then remove at least one field the AI suggested that you do not truly need.

You are done when your spec's Stack section says static or back end with a one-line reason, and it includes a data model where every field is justified.`,
        microCheck: [
          {
            question: "Your app calls a paid AI service using an API key. Why can it not be a purely static page?",
            options: [
              "Static pages are not able to display any text generated by an AI model",
              "Paid services refuse any requests that come from static hosting",
              "The key would be sent to every visitor's browser for anyone to copy",
              "Static pages cannot run JavaScript, so no request could be made",
            ],
            correctIndex: 2,
            explanation:
              "Everything in a static page is delivered to the browser, so a key placed there can be read and misused by anyone. Static pages can run JavaScript and show text; the problem is keeping the secret secret.",
          },
          {
            question: "An AI suggests a new, fashionable framework for your simple habit tracker. Why might a boring choice be better?",
            options: [
              "Newer frameworks are not allowed on most hosting services",
              "Boring technology always produces faster pages for users",
              "Established tools have more documentation and fewer surprises",
              "AI tools cannot write any working code for recently released tools",
            ],
            correctIndex: 2,
            explanation:
              "Well-established technology has known problems, plenty of answers to common errors and lots of example code, which also helps AI tools. New tools are allowed and AI can write for them, but surprises are more likely.",
          },
          {
            question: "Your sign-up form asks for date of birth, but no feature uses it. What does the data model lesson suggest?",
            options: [
              "Drop it, since data you do not store is data you cannot leak",
              "Keep it, as it may become useful for a feature later on",
              "Keep it but hide the field from the form for a while",
              "Store it in the visitor's browser rather than on the server instead",
            ],
            correctIndex: 0,
            explanation:
              "Every field you collect brings risk and, for personal data, legal duties. If no feature needs it, leave it out; you can add it later if a real need appears. Moving where it is stored does not remove the risk.",
          },
          {
            question: "Several club members need to see the same live vote count. What does that tell you about the stack?",
            options: [
              "A static page is fine, since each browser can count its own",
              "The votes should be sent to members by email instead",
              "The app needs a framework before it can show shared data",
              "Shared data needs a back end or a service acting as one",
            ],
            correctIndex: 3,
            explanation:
              "When data must be shared between users, it has to live somewhere they can all reach, which a static page on its own does not provide. Each browser counting its own votes would show different totals.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A founder prompts: \"Build a customer feedback app.\" The AI produces login, analytics, email alerts and a dark mode. What went wrong?",
        options: [
          "The AI tool was not advanced enough to follow a simple request",
          "No spec or non-goals, so the AI filled the gaps with its own ideas",
          "The prompt should have asked for the features in a different order",
          "The founder should have asked for a mobile app, not a web app",
        ],
        correctIndex: 1,
        explanation:
          "A vague request invites the AI to decide scope for you, and it tends to add features. A spec with context, features and explicit non-goals keeps version one to what you actually need.",
      },
      {
        question: "Which acceptance criterion is most useful for a \"reset password\" feature?",
        options: [
          "The reset password feature should be secure, fast and easy for every user",
          "Given an unknown email, when I submit, then I see the same message as for a known one",
          "As a user, I want to reset my password so that I can get back into my account",
          "Password reset must follow security best practice and be tested properly before launch",
        ],
        correctIndex: 1,
        explanation:
          "It names a situation, an action and a visible result, and captures a real security decision (not revealing which emails exist). The others are aims, a user story or process advice, none of which can be checked directly.",
      },
      {
        question: "You plan a recipe app as: 1) design all database tables, 2) build all screens, 3) connect everything. What is the main risk?",
        options: [
          "Databases must always be designed after the screens, not before them",
          "Three steps are too few for an AI tool to follow reliably",
          "Screens built early will need to be redesigned for mobile",
          "Nothing works for a user until the end, so problems surface late",
        ],
        correctIndex: 3,
        explanation:
          "Building in horizontal layers delays the moment anything works end to end, so mistakes are found when they are most expensive. Vertical slices deliver something usable, and checkable, after every step.",
      },
      {
        question: "An AI proposes a plan whose first slice is \"set up the full backend with authentication\". What should you do?",
        options: [
          "Replace it with a tiny end-to-end slice and move auth later",
          "Accept it, since authentication is always needed before anything",
          "Ask the AI to build the backend and frontend together",
          "Skip slicing and ask for the whole app in one prompt",
        ],
        correctIndex: 0,
        explanation:
          "The first slice should be a walking skeleton that proves the setup works. A full backend with logins is large, hard to check, and may not even be needed for version one.",
      },
      {
        question: "Your spec has examples, but no definition of done. An agent reports \"feature complete\". What is missing?",
        options: [
          "A longer context section describing the users in more detail",
          "A list of the programming languages the agent should avoid",
          "Agreed checks that must pass before a feature counts as done",
          "A section explaining why the project was started in the first place",
        ],
        correctIndex: 2,
        explanation:
          "Without a definition of done, \"complete\" is the agent's opinion. A short checklist, such as all examples passing, no console errors and a commit, makes finished something you can verify.",
      },
      {
        question: "Your bill splitter spec includes the example \"bill 80, people 4, tip 10 gives 22.00\". The AI's version shows 22.01. What is the best next step?",
        options: [
          "Accept it, since a penny difference does not matter to anyone",
          "Delete the example from the spec so the check no longer fails",
          "Treat it as a bug: the example is the agreed expected result",
          "Change the rounding rule in the spec to match what the AI did",
        ],
        correctIndex: 2,
        explanation:
          "Examples exist to catch exactly this. The spec is the agreement, so a result that does not match is a bug to investigate, not a reason to edit the spec to fit whatever the code happens to do.",
      },
      {
        question: "An analyst wants a page for her own weekly timesheet, used only on her laptop. An AI suggests a database server and user logins. What is the best response?",
        options: [
          "Start with a static page, as nothing is shared between users",
          "Accept the suggestion, as a server makes the app more secure",
          "Add logins but skip the database to keep costs a little lower",
          "Ask for a mobile app instead, as it would need no server",
        ],
        correctIndex: 0,
        explanation:
          "A back end is needed for shared data, protected data, secrets or work done when nobody is on the page. None applies here, so a server and logins add cost and risk without benefit.",
      },
      {
        question: "Which is the strongest non-goal for version one of a volunteer rota page?",
        options: [
          "The rota should be quick to load and pleasant to use on any phone",
          "Volunteers should be able to see their upcoming shifts at a glance",
          "The page should be built with care and tested before it is shared",
          "No shift swapping between volunteers; the coordinator edits the rota",
        ],
        correctIndex: 3,
        explanation:
          "A good non-goal names a specific, tempting feature you are deliberately not building, and what happens instead. The others are qualities or features, which belong in constraints or user stories.",
      },
      {
        question: "Your data model for a class booking page includes surname, phone number and home address, but only first name and email are used. What should you do?",
        options: [
          "Keep them, in case the studio wants to post out leaflets later on",
          "Remove the unused fields, because each is a risk with no benefit",
          "Keep them but make each one optional on the booking form",
          "Encrypt them all, so keeping them no longer carries any risk",
        ],
        correctIndex: 1,
        explanation:
          "Personal data brings legal duties and the risk of harm if it leaks. Fields no feature uses add that risk for nothing. Making them optional or encrypted reduces risk but does not justify collecting them.",
      },
      {
        question: "Why paste your spec at the start of each new AI session rather than relying on the AI to remember?",
        options: [
          "AI tools charge less when a spec is included in the first message",
          "Each session may start without your earlier decisions in context",
          "The AI only follows rules that appear in the first message sent",
          "Specs expire after a day, so they must be refreshed each session",
        ],
        correctIndex: 1,
        explanation:
          "Many tools start each session fresh, or lose early details in long conversations. Pasting the spec gives the AI the same decisions every time, which keeps its work consistent with what you agreed.",
      },
    ],
  },

  // ═════════════════════════════════════════════════════════════════════
  // MODULE 3
  // ═════════════════════════════════════════════════════════════════════
  {
    title: "Building in Small Loops",
    summary:
      "Build like an engineer: one change at a time, run and checked before it is saved; read and review code you did not write; use Git as your undo button; and debug by reproducing, isolating, fixing and explaining.",
    lessons: [
      {
        title: "The build loop: one change, run it, check it, save it",
        objective: "Apply a four-step build loop so every AI change is run, checked against your criteria and saved before the next one.",
        durationMinutes: 24,
        contentType: "article",
        bodyMd: `## The loop

Professional development is a loop repeated many times a day:

1. **Change**: make one small change, or ask the AI for one.
2. **Run**: run the app and look at it.
3. **Check**: test the change against your acceptance criteria, and check that what worked before still works.
4. **Save**: commit the working state to version control (Git is covered two lessons from now).

Then go round again. Each turn should take minutes, not hours.

This is a feedback loop in the systems sense: every turn tells you whether the last change moved you closer to the spec. The shorter the loop, the faster you learn and the smaller each mistake. A long loop, an hour of changes before you run anything, creates a **delay** between cause and effect, and delays are what make systems hard to steer.

## One change means one change

The hardest discipline is keeping each change small. Compare two prompts to an AI editor.

Too big:

\`\`\`text
Add a tip field, make it look nicer, and fix the rounding.
\`\`\`

One change:

\`\`\`try
Using the spec below, implement ONLY feature 2: the optional tip percentage.
- Add an input with id "tip", labelled "Tip %", accepting 0 to 30.
- Add the tip to the bill before splitting.
- Do not change the layout, the styling or any other feature.
- When finished, list every line you changed and tell me how to check it.

[PASTE YOUR SPEC]
\`\`\`

The second prompt names one feature, names the id, fences off everything else and asks for a summary of changes. That last request makes your check step much faster.

## What "check" really means

Checking is not "it seems fine". Use a short, fixed routine:

- Run every **example** in your spec for the feature you just built.
- Try at least one **edge case**: empty, zero or a silly input.
- Re-run one or two examples from **earlier features**. A change that breaks something that used to work is called a **regression**, and AI changes cause them often.
- Open the **browser console** (developer tools, usually F12, or right-click and choose Inspect) and look for red error messages.

Later you can automate much of this with tests. For now, a written checklist is enough.

## Practise the loop

This page already does feature 1 of the bill splitter. Do one turn of the loop: change it so the result also shows the total bill, run it, check it with 90 and 3, then check that 100 and 3 still gives 33.34.

\`\`\`playground
<!doctype html>
<html>
<body style="font-family: sans-serif; padding: 16px;">
  <label>Bill <input id="bill" type="number" value="90"></label><br><br>
  <label>People <input id="people" type="number" value="3"></label><br><br>
  <button id="split">Split</button>
  <p id="result"></p>
  <script>
    document.getElementById('split').addEventListener('click', function () {
      const bill = Number(document.getElementById('bill').value);
      const people = Number(document.getElementById('people').value);
      const result = document.getElementById('result');
      if (!people || people < 1) {
        result.textContent = 'Enter at least 1 person';
        return;
      }
      const each = Math.ceil((bill / people) * 100) / 100;
      result.textContent = 'Each person pays ' + each.toFixed(2);
    });
  </script>
</body>
</html>
\`\`\`

\`Math.ceil\` rounds up, which is how the spec's rule ("round each share UP to the penny") appears in code. If an AI ever swaps it for \`Math.round\`, your 100 and 3 check will catch it.

## When to stop and go back

Set yourself a rule: **two failed attempts, then go back**. If the AI's change does not work and its first fix does not work either, do not keep piling fixes on top. Return to the last saved working state and try again with a smaller, clearer request.

Piling fixes onto a broken change is exactly how the technical debt loop from Module 1 gets started. Each patch adds code nobody fully understands, which makes the next patch more likely to fail.

## Try it now

Take the playground above through two complete turns of the loop. First, show the total bill in the result. Second, make an empty bill box show "Enter the bill amount" instead of a result. For each turn, write one line: what you changed, what you checked, and what happened.

You are done when both changes work, 100 and 3 still gives 33.34, and you have your two-line log.`,
        microCheck: [
          {
            question: "You asked an AI to add a tip field. It works, but the Clear button no longer resets the form. What is this called?",
            options: [
              "Scope creep: the project grew beyond the agreed features",
              "An edge case: an unusual input the spec did not cover",
              "A stack problem: the technology cannot support both features",
              "A regression: the change broke something that used to work",
            ],
            correctIndex: 3,
            explanation:
              "A regression is when a new change breaks existing behaviour. That is why the check step always re-runs a few examples from earlier features, not just the one you just built.",
          },
          {
            question: "Why does a long build loop, with an hour of changes before you run anything, make problems harder to fix?",
            options: [
              "The delay hides which of many changes caused each problem",
              "AI tools lose accuracy when asked for many changes an hour",
              "Browsers can only preview a small number of changes at once",
              "Long loops use more tokens, so the AI's answers get shorter",
            ],
            correctIndex: 0,
            explanation:
              "When many changes pile up before a check, cause and effect are far apart and tangled together. Short loops keep each mistake small and easy to trace to the one change that caused it.",
          },
          {
            question: "An AI change fails, and its first fix fails too. What does the lesson recommend?",
            options: [
              "Keep asking for fixes, since the third attempt usually works",
              "Ask the AI to rewrite the entire file again from the very beginning",
              "Go back to the last working state and ask for a smaller change",
              "Switch to a different AI tool and paste in the broken code",
            ],
            correctIndex: 2,
            explanation:
              "Stacking fixes on a broken change adds code nobody understands and feeds technical debt. Returning to a known good state and making a smaller, clearer request is usually faster and leaves cleaner code.",
          },
          {
            question: "Why does the \"one change\" prompt ask the AI to list every line it changed?",
            options: [
              "The AI writes better code when it knows it will be reviewed",
              "Listing changed lines is needed before Git is able to save the work",
              "It makes checking faster and exposes changes you did not want",
              "It lets the AI undo its own changes if you ask it to later",
            ],
            correctIndex: 2,
            explanation:
              "A summary of changes tells you where to look and makes unrequested edits easy to spot. Git does not need it, and relying on the AI to undo itself is weaker than having your own saved state.",
          },
        ],
      },
      {
        title: "Reading code you did not write",
        objective: "Trace a feature through AI-written code and spot scope creep and risky changes in a diff.",
        durationMinutes: 25,
        contentType: "article",
        bodyMd: `## You are the reviewer now

When an AI writes the code, your job shifts from writing to **reviewing**. In professional teams, code usually does not go live until someone other than its author has read it. When you build with AI, that reviewer is you.

You do not need to understand every line. You need to answer three questions:

1. Does this change do what I asked?
2. Did it change anything I did not ask for?
3. Did it add anything risky?

## Ask the AI to explain, at the right level

An AI can explain code that it or anyone else wrote. Ask for the level you need, and ask it to connect the code to your spec.

\`\`\`try
Explain this code for someone who can read a little HTML and JavaScript but is not a developer.
1. In two sentences, what does it do overall?
2. Step by step, what happens when the user [clicks the Split button]?
3. Point out anything that looks unfinished, risky, or not needed for this spec: [PASTE SPEC OR ONE-LINE SUMMARY].

[PASTE THE CODE]
\`\`\`

Treat the explanation as a guide, not proof. AI explanations can be confidently wrong, especially about code that is itself wrong. Check any important claim against what the app actually does.

## Trace one feature

**Tracing** means following one user action through the code, from the thing they touch to the result they see. In a small web page it usually goes:

1. **The element**: find the button or input in the HTML and note its id.
2. **The listener**: search the JavaScript for that id to find the code that runs when it is used (look for \`addEventListener\` or \`onclick\`).
3. **The logic**: follow what that code reads, calculates and decides.
4. **The output**: find where it writes back to the page (\`textContent\`, \`innerHTML\`) or saves data.

Your editor's search (Ctrl+F, or Cmd+F on a Mac) for the id is the fastest way in. If you can trace one feature end to end, you understand the shape of the whole file.

## Reading a diff

A **diff** shows exactly what changed: lines starting with \`-\` were removed, lines starting with \`+\` were added. Suppose you asked only for "add a tip percentage input". The AI returned this:

\`\`\`diff
   <label>People <input id="people" type="number"></label>
+  <label>Tip % <input id="tip" type="number" min="0" max="30"></label>
-  <button id="split">Split</button>
+  <button id="calculate">Split</button>
+  <script src="https://cdn.example.com/confetti.js"></script>
   ...
-  const each = Math.ceil((bill / people) * 100) / 100;
+  const tip = Number(document.getElementById('tip').value) || 0;
+  const total = bill + bill * tip / 100;
+  const each = Math.round((total / people) * 100) / 100;
+  localStorage.setItem('lastBill', bill);
\`\`\`

The tip input and the tip calculation are what you asked for. But look again:

- The button id changed from \`split\` to \`calculate\`. Anything relying on the old id, including your automated checks, now breaks.
- A script from another website was added. That is code you do not control, and it breaks the spec's "no external scripts" rule.
- \`Math.ceil\` became \`Math.round\`, silently changing the rounding rule. 100 split three ways now gives 33.33, which does not cover the bill.
- The bill is now saved in the browser's storage, which you never asked for.

This is **scope creep** inside a single change: the AI did your task plus four others. Each looks harmless alone. Together they break the spec.

## Red flags in any change

- Files or sections changed that have nothing to do with the task
- Renamed ids, functions or files
- New external scripts, packages or services
- Deleted checks, validation or tests
- Anything that looks like a password or key written into the code
- Data being saved, or sent, somewhere new

When you see one, ask: "Why did you change X? I only asked for Y. Please undo X." Or go back to your last saved state and ask again with tighter fences. Reviewing like this is also how you keep the technical debt loop from Module 1 in check: debt you catch at review never enters the codebase.

## Try it now

Paste the diff above into the practice pad and ask: "I asked only for a tip input. List every change in this diff that goes beyond that, and explain the risk of each." Compare the AI's list with the four problems above.

You are done when you have found all four yourself, noted any the AI missed or invented, and written the one-sentence prompt you would send to get a clean version of the change.`,
        microCheck: [
          {
            question: "You asked an AI to fix a typo in a heading. The diff also shows a new external script tag. What should you do?",
            options: [
              "Ask why it was added and remove it unless you truly need it",
              "Keep it, as AI tools only add scripts when they are required",
              "Keep it, but check again later whether it has caused problems",
              "Ignore it, as script tags cannot affect how the page behaves",
            ],
            correctIndex: 0,
            explanation:
              "An unrequested external script is code you do not control, added for a task that did not need it. It is a red flag to question and usually remove. Script tags can change everything about how a page behaves.",
          },
          {
            question: "You want to understand what happens when the Save button is clicked. Where should you start tracing?",
            options: [
              "Read the whole JavaScript file carefully from top to bottom first",
              "Ask the AI to rewrite the code so it is easier to follow",
              "Look in the CSS for the rules that style the Save button",
              "Find the button's id, then search the JavaScript for that id",
            ],
            correctIndex: 3,
            explanation:
              "Tracing follows one action from the element to its listener, logic and output, and searching for the id is the fastest way in. Reading everything is slow, and CSS controls looks, not behaviour.",
          },
          {
            question: "Why should you treat an AI's explanation of code as a guide rather than proof?",
            options: [
              "AI tools are not allowed to explain code that others have written",
              "It can be confidently wrong, especially about code that is wrong",
              "Explanations always leave out the lines that matter most",
              "The AI explains what it planned, not what the code contains",
            ],
            correctIndex: 1,
            explanation:
              "An explanation sounds equally sure whether it is right or wrong. Check important claims against what the app actually does. The AI can explain anyone's code, and it does not always leave out key lines.",
          },
          {
            question: "In the sample diff, which change silently breaks the spec's \"round each share UP\" rule?",
            options: [
              "The new tip input being limited to whole values from 0 to 30",
              "Math.ceil being replaced by Math.round in the calculation",
              "The tip being added to the bill before it is split",
              "The tip value defaulting to 0 when the box is empty",
            ],
            correctIndex: 1,
            explanation:
              "Math.ceil rounds up, so every share covers the bill; Math.round can round down, giving 33.33 for 100 split three ways. The tip limits, order and default all match what the spec asked for.",
          },
        ],
      },
      {
        title: "Git as your undo button",
        objective: "Use Git to commit before every AI change, write clear messages, experiment on branches and undo changes safely.",
        durationMinutes: 27,
        contentType: "article",
        resources: [
          {
            title: "Git documentation",
            url: "https://git-scm.com/doc",
            resourceType: "article",
            isFree: true,
            notes: "Official reference and the free Pro Git book.",
          },
        ],
        bodyMd: `## Why version control

**Version control** keeps a history of your project, so you can see what changed, when and why, and go back to any earlier state. **Git** is the most widely used version control system. You will also hear of GitHub, GitLab and similar sites: they host Git projects online. Git itself runs on your computer.

For building with AI, Git offers one essential thing: **an undo that always works**. An AI can change twenty files in seconds. Without Git, getting back to the version that worked relies on memory and luck. With Git, it is one command.

## Four words to know

- **Repository (repo)**: a project folder that Git is tracking.
- **Commit**: a saved snapshot of the project, with a message saying what changed.
- **Branch**: a separate line of work, so you can experiment without touching the version that works.
- **Revert**: a new commit that undoes an earlier one, keeping the history honest.

## The everyday commands

You type these in a terminal, inside your project folder. Many AI editors also have buttons that do the same thing.

\`\`\`bash
git init              # start tracking this folder (once per project)
git status            # what has changed since the last commit?
git diff              # show exactly which lines changed
git add .             # stage all changes for the next commit
git commit -m "Add optional tip percentage (0-30)"
git log --oneline     # list recent commits, one per line
\`\`\`

The dot in \`git add .\` means "everything in this folder". Run \`git status\` first so you know what "everything" is.

## Commit before every AI change

This is the single most useful habit in the track. Before you ask an AI to change anything, commit the working state. Then:

- If the change is good, check it and commit again.
- If it is bad, throw it away and you are back where you started.

To discard changes to tracked files that you have not yet staged or committed:

\`\`\`bash
git restore .
\`\`\`

Be sure before you run it: changes that were never committed are gone for good. New files the AI created are not removed by this, and \`git status\` will still list them.

## A sample history

Here is what a healthy \`git log --oneline\` looks like for the bill splitter:

\`\`\`text
a41f9c2 Show error in result area when people is 0 or empty
7d03e5b Round each share up to the penny (spec example 100/3)
c92b1aa Add optional tip percentage (0-30)
5e8d310 Add Clear button that resets all fields
19bc4f0 Split bill evenly between people
0f3a7e1 Walking skeleton: page with inputs and Split button
\`\`\`

The newest commit is at the top. Each line is one small, finished step, and each message says **what changed** (and, where useful, why) in plain words. Messages like "fix", "update" or "AI changes" tell your future self nothing. A good pattern: start with a verb, keep it under about 70 characters, and name the feature.

## Undoing something you already committed

Suppose commit \`c92b1aa\` (the tip feature) turns out to have broken something. To undo just that commit, keeping everything after it:

\`\`\`bash
git revert c92b1aa
\`\`\`

Git creates a new commit that reverses those changes. The history still shows what happened, which is what you want, especially in a shared project. You will see advice to use \`git reset --hard\` instead. It rewrites history and can destroy work, so avoid it until you understand exactly what it does.

## Branches for experiments

For something bigger or riskier, such as a redesign, work on a branch:

\`\`\`bash
git switch -c try-new-layout   # create a branch and move onto it
# ...change, check, commit as usual...
git switch main                # go back to the working version
git merge try-new-layout       # bring the experiment in, if it worked
\`\`\`

If the experiment fails, switch back to \`main\` and leave the branch alone, or delete it. Your working version was never touched. (Some projects call the main branch \`master\`.)

## Keep secrets out of Git

Anything you commit stays in the history, even if you delete the file later. Never commit passwords or API keys. Keep them in a file such as \`.env\`, and list that file in \`.gitignore\`, a file that tells Git what never to track. If a key is ever committed, treat it as leaked: cancel it and create a new one.

## Try it now

\`\`\`try
Here is the output of git diff for my project:

[PASTE THE OUTPUT OF git diff]

Write a commit message for this change: one line, under 70 characters, starting with a verb, saying what changed. If the diff contains more than one unrelated change, tell me and suggest how to split it into separate commits.
\`\`\`

If you have Git installed, create a folder containing the bill splitter page from the build loop lesson. Run \`git init\` and make three commits: the starting page, one small change, and a second small change. Then \`git revert\` the second. If you do not have Git yet, run the prompt above with the sample diff from the previous lesson instead.

You are done when \`git log --oneline\` shows four commits with clear messages, or, without Git, when you have checked the AI's commit message and its plan for splitting that diff into separate commits.`,
        microCheck: [
          {
            question: "You are about to ask a coding agent to restructure your app. What should you do first?",
            options: [
              "Create a new empty folder and start the project again there",
              "Write down which files exist so you can spot any new ones",
              "Delete the Git history so the agent can see a clean project",
              "Commit the current working state so you can get back to it",
            ],
            correctIndex: 3,
            explanation:
              "Committing before every AI change gives you a known good state to return to with one command. Deleting history throws away your undo, and a list of files is a weak substitute for a real snapshot.",
          },
          {
            question: "Which commit message is most useful to your future self?",
            options: [
              "Round each share up to the penny so bills are covered",
              "Fixed some stuff the AI got wrong in the last change",
              "Update index.html with the latest version of the code",
              "Changes made on Tuesday afternoon after the review",
            ],
            correctIndex: 0,
            explanation:
              "A good message says what changed, and ideally why, in plain words. The others describe when or where something happened, or that something changed, which tells you nothing when searching the history later.",
          },
          {
            question: "A committed change broke the app, and later good commits sit on top of it. Which command undoes just that change safely?",
            options: [
              "git reset --hard, which returns everything to an older state",
              "git restore ., which discards all changes not yet committed",
              "git revert and the commit's id, adding a commit that undoes it",
              "git init, which starts a fresh history for the project folder",
            ],
            correctIndex: 2,
            explanation:
              "git revert creates a new commit that reverses one earlier commit and keeps the later work. reset --hard can destroy work, restore only affects uncommitted changes, and init does not undo anything.",
          },
          {
            question: "You accidentally committed an API key, then deleted it in the next commit. What should you do?",
            options: [
              "Nothing, since deleting it in the next commit removed it",
              "Rename the file that held it so the history cannot find it",
              "Treat the key as leaked, so cancel it and create a new one",
              "Add the file to .gitignore, which removes it from history",
            ],
            correctIndex: 2,
            explanation:
              "Everything committed stays in the history, so the key is still there to be found. The safe response is to cancel it. .gitignore only stops future tracking; it does not erase what was already committed.",
          },
        ],
      },
      {
        title: "Debugging with AI: reproduce, isolate, fix, explain",
        objective: "Debug a broken feature by reproducing it, reading the error, isolating the cause and giving the AI a precise bug report.",
        durationMinutes: 28,
        contentType: "article",
        bodyMd: `## Four steps, in order

When something breaks, the vibe-coding reflex is to paste "it doesn't work, fix it" into the AI. Sometimes that works. Often the AI guesses, changes several things, and you end up with a different bug. Engineers debug in four steps:

1. **Reproduce**: find exact steps that make the bug happen every time.
2. **Isolate**: narrow down where it goes wrong.
3. **Fix**: change the smallest thing that corrects it.
4. **Explain**: understand why it happened, so you can check for the same mistake elsewhere.

## Reproduce: exact steps

"The total is wrong sometimes" is not a bug report. This is:

\`\`\`text
Steps: enter 20 in Starter, enter 15 in Main, press Total.
Expected: Total: 35
Actual: Total: 2015
Happens: every time, in more than one browser.
\`\`\`

If you cannot make a bug happen on demand, you cannot know whether you have fixed it. Keep the steps: after the fix, you run them again.

## Reading an error message

Many bugs produce a message in the **browser console**. Open it with F12, or right-click the page, choose Inspect, then the Console tab. A typical error looks like this:

\`\`\`text
Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
    at app.js:12:7
\`\`\`

Read it in parts:

- **TypeError**: the kind of error. The code tried to use a value of the wrong type.
- **Cannot read properties of null**: the code expected an element but got \`null\`, which means "nothing found".
- **(reading 'addEventListener')**: it was trying to attach a click handler to that nothing.
- **app.js:12:7**: the file, line 12, character 7. Start there.

The list of "at ..." lines is the **stack trace**: the chain of function calls that led to the error, most recent first. Start from the top line that points at your own code.

This particular error usually means \`getElementById\` was given an id that does not exist on the page, or the script ran before the element had loaded. Remember the renamed button from Module 1: this is what that bug looks like from the inside.

## Isolate: shrink the problem

Narrow it down before asking anyone, human or AI:

- Which **inputs** trigger it? Does 2 plus 3 also go wrong?
- Which **line** first holds a wrong value? Add a temporary line such as \`console.log('starter is', starter, typeof starter);\` and read the console.
- Did it ever work? Use \`git log\` to find the change that introduced it.

## A bug to fix

This page has the bug from the report above. Reproduce it, isolate it with a \`console.log\`, then fix it.

\`\`\`playground
<!doctype html>
<html>
<body style="font-family: sans-serif; padding: 16px;">
  <h2>Order total</h2>
  <label>Starter <input id="starter" type="number" value="20"></label><br><br>
  <label>Main <input id="main" type="number" value="15"></label><br><br>
  <button id="total">Total</button>
  <p id="out"></p>
  <script>
    document.getElementById('total').addEventListener('click', function () {
      const starter = document.getElementById('starter').value;
      const main = document.getElementById('main').value;
      const sum = starter + main;
      document.getElementById('out').textContent = 'Total: ' + sum;
    });
  </script>
</body>
</html>
\`\`\`

Hint, if you need it: an input's \`value\` is always **text**, even in a number box. With text, \`+\` joins instead of adding, so "20" + "15" becomes "2015". Wrapping each value in \`Number(...)\` fixes it.

## Give the AI a proper bug report

When you do ask the AI, give it what a good colleague would need:

\`\`\`try
I have a bug in a small web page.

What I did: [exact steps]
What I expected: [expected result]
What happened: [actual result]
Error in the console, copied exactly: [PASTE ERROR, OR "none"]
What I have already checked: [for example, console.log shows the values are text]

Here is the relevant code:
[PASTE CODE]

Explain the cause first, in plain English. Then propose the smallest fix, changing as few lines as possible. Do not change anything unrelated.
\`\`\`

"Explain the cause first" is deliberate. If the explanation does not match what you saw, the fix is probably a guess.

## Explain: close the loop

After the fix, run your reproduction steps again, then your earlier examples to catch regressions. Then ask: where else could this happen? If one input was treated as text, others probably are too. Commit the fix with a message that names the cause, such as "Convert order inputs to numbers before adding".

## Try it now

Fix the playground bug using the four steps. Then add a third input with the id \`dessert\` and make sure the total includes it without bringing the bug back.

You are done when 20, 15 and 5 give "Total: 40", an empty dessert box does not break the total, and you can explain the cause in one sentence.`,
        microCheck: [
          {
            question: "The console shows: Cannot read properties of null (reading 'addEventListener'). What is the most likely cause?",
            options: [
              "The script asked for an element by an id that is not on the page",
              "The button was clicked too many times in a row for the browser",
              "The page's CSS stopped the button from receiving any clicks",
              "The JavaScript file is too long for the browser to finish reading",
            ],
            correctIndex: 0,
            explanation:
              "null means \"nothing found\", so the code tried to attach a click handler to an element that does not exist, usually because of a wrong or renamed id, or a script running before the element loaded.",
          },
          {
            question: "Why reproduce a bug with exact steps before trying to fix it?",
            options: [
              "AI tools refuse to help unless the steps are written out first",
              "Exact steps make the bug happen less often for other users",
              "It proves to others that the bug was not caused by you",
              "Without them you cannot tell whether a fix actually worked",
            ],
            correctIndex: 3,
            explanation:
              "A reliable way to trigger the bug is also your test for the fix: run the steps again and see if it is gone. Without it, a bug that seems fixed may simply not have happened this time.",
          },
          {
            question: "Two number inputs of 20 and 15 produce a total of 2015. What does this tell you?",
            options: [
              "The inputs are in the wrong order in the page's HTML markup",
              "The values are being joined as text rather than added as numbers",
              "The browser is rounding the numbers before it adds them",
              "The total element is showing two results side by side",
            ],
            correctIndex: 1,
            explanation:
              "Input values are text, and with text the + sign joins rather than adds. Converting each value with Number() before adding fixes it. Order, rounding and display are not what produces 2015.",
          },
          {
            question: "Why does the bug report prompt ask the AI to explain the cause before proposing a fix?",
            options: [
              "AI tools are unable to fix code without describing it first",
              "An explanation that does not match what you saw exposes a guess",
              "Explanations stop the AI from changing more than one line",
              "It makes the fix shorter, since the explanation uses up space",
            ],
            correctIndex: 1,
            explanation:
              "If the stated cause does not fit your symptoms and checks, the proposed fix is probably a guess. Asking for the cause first lets you judge the fix before you apply it.",
          },
          {
            question: "You have fixed one bug where a price input was treated as text. What should the \"explain\" step lead you to do next?",
            options: [
              "Ask the AI to rewrite the whole page to prevent any more bugs",
              "Delete the console.log lines and move on to the next feature",
              "Add a note on the page asking users to type numbers carefully",
              "Check the other inputs for the same mistake, then commit",
            ],
            correctIndex: 3,
            explanation:
              "Understanding the cause tells you where else it might occur, since other inputs are probably handled the same way. Check them, re-run earlier examples, and commit with a message naming the cause.",
          },
        ],
      },
    ],
    quiz: [
      {
        question: "A colleague asks an AI to \"add search, fix the layout and speed things up\" in one prompt. Afterwards two old features are broken. What would have prevented this?",
        options: [
          "One change per loop, each checked and committed before the next",
          "A longer prompt describing all three changes in more detail",
          "Using a more capable AI model that makes fewer mistakes",
          "Running all three changes together on a separate computer",
        ],
        correctIndex: 0,
        explanation:
          "Bundling changes makes it impossible to tell which one caused a regression. One change, run, check and save per loop keeps each mistake small and traceable. A better model or longer prompt does not fix the process.",
      },
      {
        question: "You review a diff for \"add a date picker\". It also renames a function, deletes a validation check and adds a package. What is the best response?",
        options: [
          "Accept it, as the AI probably improved the code while it worked",
          "Accept the date picker and test the extra changes next week",
          "Ask for just the date picker, with the other changes undone",
          "Reject all AI changes from now on and write the code by hand",
        ],
        correctIndex: 2,
        explanation:
          "Renames, deleted validation and new packages are red flags when you did not ask for them. Keep the requested change and undo the rest. Abandoning AI entirely overreacts; the fix is tighter review and prompts.",
      },
      {
        question: "Your app worked yesterday and is broken today after several AI sessions. How can Git help you find the cause fastest?",
        options: [
          "Run git init again so that the history is cleaned and restarted",
          "Delete the project folder and clone the online copy from scratch",
          "Use the log to find the last good commit and compare the changes",
          "Git cannot help, as it only stores files and not their behaviour",
        ],
        correctIndex: 2,
        explanation:
          "The history shows every change since it last worked. Checking the last good commit and the diffs since then narrows the cause quickly. Restarting the history or re-cloning throws away that evidence.",
      },
      {
        question: "Which bug report gives an AI the best chance of a correct fix?",
        options: [
          "Steps, expected result, actual result, exact error, and the code",
          "A description of the bug plus a request to rewrite the whole file",
          "The word \"broken\" and a screenshot of the page at the time",
          "A list of every file in the project with a request to find bugs",
        ],
        correctIndex: 0,
        explanation:
          "Exact steps, expected and actual results, the precise error and the relevant code let the AI reason about the real cause. Vague reports and whole-project requests invite guesses and unrelated changes.",
      },
      {
        question: "You are about to try a risky redesign suggested by an AI. What is the safest way to do it?",
        options: [
          "Do it on main, and use git reset --hard if it goes wrong",
          "Copy the project folder by hand and edit both copies",
          "Skip committing until the redesign is fully finished",
          "Do it on a branch, so main keeps the version that works",
        ],
        correctIndex: 3,
        explanation:
          "A branch keeps your working version untouched while you experiment, and you merge only if it works. reset --hard can destroy work, manual copies drift apart, and skipping commits removes your undo.",
      },
      {
        question: "An AI explains that a function \"validates the email address\". When you trace it, the function only checks that the field is not empty. What should you conclude?",
        options: [
          "The explanation is right, as emptiness is a kind of validation",
          "The explanation was wrong; trust what the code actually does",
          "The code must be wrong, because the AI's explanation is clear",
          "Both are fine, as long as the page shows no console errors",
        ],
        correctIndex: 1,
        explanation:
          "AI explanations can be confidently wrong. Tracing showed what the code really does, and that is what users get. Whether a simple non-empty check is enough is then a decision to make against your spec.",
      },
      {
        question: "You find your API key written directly into a JavaScript file the AI created, and you have not committed yet. What should you do?",
        options: [
          "Commit it now and delete the key in the following commit",
          "Move the key to .env, add .env to .gitignore, then commit",
          "Leave it, since the key is only visible to the developer",
          "Rename the variable so the key is harder to recognise",
        ],
        correctIndex: 1,
        explanation:
          "Keeping secrets in an ignored file means they never enter the history. Anything committed stays in the history even if deleted later, and a key in front-end JavaScript is visible to every visitor.",
      },
      {
        question: "After fixing a bug, you re-run only the steps that reproduced it. It passes. What have you missed?",
        options: [
          "Asking the AI to confirm in writing that the bug is truly fixed",
          "Reading the full stack trace again now that the bug is gone",
          "Clearing the browser cache so that the page loads more quickly",
          "Checking earlier examples, in case the fix caused a regression",
        ],
        correctIndex: 3,
        explanation:
          "A fix can break something else. Re-running a few earlier examples catches regressions. An AI's confirmation is not evidence, and the stack trace is no longer relevant once the error has gone.",
      },
      {
        question: "The console shows an error with a long stack trace. Most lines mention a library you did not write; one line mentions your app.js at line 40. Where should you start?",
        options: [
          "At app.js line 40, the first line pointing at your own code",
          "At the very last line of the trace, where the chain began",
          "In the library, as that is where most of the lines point",
          "Nowhere yet: restart the browser and see if it recurs",
        ],
        correctIndex: 0,
        explanation:
          "Your own code is usually where the mistake is, even when the error surfaces inside a library, so start at the first line that points at it. Libraries are rarely the cause, and restarting hides the evidence.",
      },
      {
        question: "Why is \"commit before every AI change\" called the single most useful habit in this module?",
        options: [
          "It makes the AI produce smaller changes that are easier to read",
          "It sends each change for review by another person automatically",
          "It guarantees a working state you can return to in one step",
          "It stops the AI from changing any files you have committed",
        ],
        correctIndex: 2,
        explanation:
          "A commit before each change means any bad change can be discarded instantly, which makes experimenting with AI safe. It does not change the AI's behaviour, trigger reviews or lock files.",
      },
    ],
  },
];
