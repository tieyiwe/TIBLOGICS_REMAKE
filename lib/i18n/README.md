# Languages: English, French, Swahili

English is primary. The visitor's browser language (Accept-Language) picks the
first language; the language switcher (`components/LanguageSwitcher.tsx`) sets
a `tib_lang` cookie that overrides it. Admin pages stay in English.

## Interface text: dictionaries

Every piece of visible interface text comes from a dictionary in
`lib/i18n/messages/<namespace>.ts`, which has `en`, `fr` and `sw` objects with
the same keys. Keys are namespaced: `home.hero.title`, `learn.lesson.next`.

- Server components: `const t = await getT();` from `@/lib/i18n/server`.
- Client components: `const t = useT();` from `@/lib/i18n/client`.
- Variables: `t("learn.points", { n: 40 })` with `"{n} points"` in the dictionary.
- Plurals: use separate keys (`...one`, `...other`) and pick in code.
- Page metadata: make `generateMetadata` async and use `getT()`.
- Numbers, dates, money: `toLocaleString(locale)` / `Intl.NumberFormat(locale)`,
  where `locale` comes from `getLocale()` or `useLocale()`.
- Keep brand and product names in English: TIBLOGICS, Learning Box, Toolkit
  Live, Compliance Guard, Readiness Monitor, Automation Blueprint, Code Studio,
  InStory, Echelon.

## Translation quality

- French: natural international French, "vous", French typography
  (space before : ; ? !), « » quotes. Suitable for France and francophone Africa.
- Swahili: standard Kiswahili (East Africa). Where there is no common Swahili
  word for a technical term (AI, prompt, email, app), keep the English term;
  "akili bandia (AI)" is fine for AI on first use in a page.
- Translate meaning, not words. Keep it as short as the English where the
  layout is tight (buttons, tabs).
- No em dashes in any language.

## Long content (lessons, blog posts, prompts, labs)

Written in English and translated by the model once, cached in the database
(`lib/i18n/content.ts`): use `localized(key, locale, fields)` for one record
and `localizedList(key, locale, rows)` for a list. They return English plus
`pending: true` until the translation exists (show `common.translationPending`),
and `npm run cron translate` pre-warms everything.

## AI replies

Anything the model writes for a visitor (practice pad, lab feedback, Toolkit
drafts, chat) must be in the visitor's language: append
`replyInLanguage(locale)` from `@/lib/i18n/config` to the system prompt.
