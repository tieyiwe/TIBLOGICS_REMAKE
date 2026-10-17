# Content translation sources

Each file here owns one kind of long content and exports:

- field builders used by the pages that show it (so the page and the warm-up
  job always hash exactly the same fields), and
- `export async function warm(locale: Locale, budget: { left: number }): Promise<number>`
  which translates not-yet-cached items with `translated(key, locale, fields, "wait")`,
  decrements `budget.left` per model call, stops at 0, and returns how many it
  translated. The `translate` cron job calls every warm() in turn.

Keys are stable and prefixed by kind: `lesson:<id>`, `track:<slug>`,
`quiz:<id>`, `lab:<slug>`, `post:<slug>`, `prompts:<vertical>:<category>`.
