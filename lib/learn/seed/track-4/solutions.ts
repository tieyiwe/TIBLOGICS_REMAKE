// Reference solutions for the Vibe Coding Like a Software Engineer code labs.
//
// Used only for testing: each solution must pass every automated check in its
// lab (see ./assessments.ts), and the starter code must fail the checks about
// required behaviour. The app never imports this file.

export const TRACK_4_SOLUTIONS: Record<string, string> = {
  "vibe-coding-lab-3-bill-splitter": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bill splitter</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 2rem auto; padding: 0 1rem; }
    label { display: block; margin-top: 0.75rem; }
    #error { color: #b00020; }
  </style>
</head>
<body>
  <h1>Bill splitter</h1>

  <label>Bill <input id="bill" type="number" min="0" step="0.01"></label>
  <label>Tip (%) <input id="tip" type="number" min="0" value="10"></label>
  <label>People <input id="people" type="number" min="1" step="1" value="2"></label>

  <p>Total: <span id="total">0.00</span></p>
  <p>Each: <span id="each">0.00</span></p>
  <p id="error" role="alert" hidden></p>

  <script>
    const billInput = document.getElementById("bill");
    const tipInput = document.getElementById("tip");
    const peopleInput = document.getElementById("people");
    const totalEl = document.getElementById("total");
    const eachEl = document.getElementById("each");
    const errorEl = document.getElementById("error");

    function showError(message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
      totalEl.textContent = "-";
      eachEl.textContent = "-";
    }

    function update() {
      const billText = billInput.value.trim();
      const tipText = tipInput.value.trim();
      const bill = Number(billText);
      const tip = tipText === "" ? 0 : Number(tipText);
      const people = Number(peopleInput.value);

      if (billText === "" || !Number.isFinite(bill)) return showError("Enter the bill amount.");
      if (bill < 0) return showError("The bill cannot be negative.");
      if (!Number.isFinite(tip) || tip < 0) return showError("The tip must be 0 or more.");
      if (!Number.isInteger(people) || people < 1) return showError("Split between at least 1 person.");

      const total = bill + (bill * tip) / 100;
      errorEl.textContent = "";
      errorEl.hidden = true;
      totalEl.textContent = total.toFixed(2);
      eachEl.textContent = (total / people).toFixed(2);
    }

    for (const input of [billInput, tipInput, peopleInput]) {
      input.addEventListener("input", update);
    }
  </script>
</body>
</html>
`,

  "vibe-coding-lab-4-fix-the-bug-then-prove-it": `<!doctype html>
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
      const text = input.value.trim();
      if (text === "") return;

      const li = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = text;

      const remove = document.createElement("button");
      remove.textContent = "Remove";
      remove.addEventListener("click", function () {
        li.remove();
        updateCount();
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

  "vibe-coding-lab-6-harden-and-ship": `<!doctype html>
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
  <label>Name <input id="name" maxlength="80" autocomplete="name"></label>
  <label>Email <input id="email" type="email" autocomplete="email"></label>
  <label>Comment (up to 500 characters) <textarea id="comment" rows="4"></textarea></label>
  <button id="submit" type="button">Submit</button>
  <p id="error" role="alert" hidden></p>
  <h2>Comments</h2>
  <ul id="list"></ul>

  <script>
    // Analytics now happens on the server, which holds its key in an
    // environment variable. No keys belong in this page.
    const MAX_COMMENT = 500;
    const EMAIL_PATTERN = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const commentInput = document.getElementById("comment");
    const list = document.getElementById("list");
    const errorEl = document.getElementById("error");

    function showError(message) {
      errorEl.textContent = message;
      errorEl.hidden = false;
    }

    function clearError() {
      errorEl.textContent = "";
      errorEl.hidden = true;
    }

    function validate(name, email, comment) {
      if (name === "") return "Please enter your name.";
      if (name.length > 80) return "Please keep your name under 80 characters.";
      if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email address.";
      if (comment === "") return "Please write a comment.";
      if (comment.length > MAX_COMMENT) return "Please keep your comment to " + MAX_COMMENT + " characters or fewer.";
      return null;
    }

    document.getElementById("submit").addEventListener("click", function () {
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const comment = commentInput.value.trim();

      const problem = validate(name, email, comment);
      if (problem) return showError(problem);
      clearError();

      const li = document.createElement("li");
      const who = document.createElement("strong");
      who.textContent = name;
      li.appendChild(who);
      li.appendChild(document.createTextNode(": " + comment));
      list.appendChild(li);

      commentInput.value = "";
    });
  </script>
</body>
</html>
`,
};
