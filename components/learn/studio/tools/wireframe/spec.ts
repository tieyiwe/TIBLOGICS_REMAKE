// Turns a wireframe into a build-ready spec: user stories, Given/When/Then
// acceptance criteria and a prompt for an AI app builder. Pure: takes the
// translator so the spec comes out in the learner's language.

import { tabItems, type Comp, type Design, type Screen } from "./model";

type Tr = (key: string, vars?: Record<string, string | number>) => string;
const NS = "studio.wireframe-builder";

export interface Criterion {
  screen: string;
  given: string;
  when: string;
  then: string;
}

export interface Spec {
  stories: string[];
  criteria: Criterion[];
  prompt: string;
  markdown: string;
}

export function labelOf(c: Comp, t: Tr): string {
  return c.label.trim() || t(`${NS}.comp.${c.type}.default`);
}

export function buildSpec(d: Design, t: Tr, appFallback: string): Spec {
  const k = (s: string, v?: Record<string, string | number>) => t(`${NS}.spec.${s}`, v);
  const app = d.app.trim() || appFallback;
  const byId = new Map(d.screens.map((s) => [s.id, s]));
  const target = (c: Comp) => (c.link ? byId.get(c.link)?.name : undefined);
  const stories: string[] = [];
  const criteria: Criterion[] = [];

  for (const s of d.screens) {
    const on = k("ac.onScreen", { screen: s.name });
    for (const c of s.comps) {
      const label = labelOf(c, t);
      const to = target(c);
      const note = c.note.trim();
      switch (c.type) {
        case "input":
          stories.push(k("story.input", { label, screen: s.name }));
          criteria.push({ screen: s.name, given: on, when: k("ac.input.when", { label }), then: k("ac.input.then") });
          break;
        case "button": {
          const outcome = to ? k("outcome.link", { target: to }) : note || k("outcome.default");
          stories.push(k("story.button", { label, outcome }));
          criteria.push({
            screen: s.name,
            given: on,
            when: k("ac.button.when", { label }),
            then: to ? k("ac.button.thenLink", { target: to }) + (note ? `; ${note}` : "") : note || k("ac.button.thenDefault"),
          });
          break;
        }
        case "error":
          criteria.push({ screen: s.name, given: on, when: note || k("ac.error.when"), then: k("ac.error.then", { label }) });
          break;
        case "empty":
          criteria.push({ screen: s.name, given: k("ac.empty.given"), when: k("ac.open", { screen: s.name }), then: k("ac.empty.then", { label }) });
          break;
        case "list":
          stories.push(k("story.list", { label, screen: s.name }));
          criteria.push({ screen: s.name, given: k("ac.list.given"), when: k("ac.open", { screen: s.name }), then: k("ac.list.then", { label }) + (to ? `; ${k("ac.list.tap", { target: to })}` : "") });
          break;
        case "tabs": {
          const items = tabItems(label);
          stories.push(k("story.tabs", { label: items.join(", ") }));
          criteria.push({ screen: s.name, given: on, when: k("ac.tabs.when"), then: k("ac.tabs.then") });
          break;
        }
        default:
          if (to) {
            stories.push(k(c.type === "header" ? "story.back" : "story.nav", { label, screen: s.name, target: to }));
            criteria.push({ screen: s.name, given: on, when: k("ac.button.when", { label }), then: k("ac.button.thenLink", { target: to }) });
          }
      }
    }
  }

  const compLine = (c: Comp) => {
    let line = `  - ${t(`${NS}.comp.${c.type}`)}: "${labelOf(c, t)}"`;
    const to = target(c);
    if (to) line += ` ${k("prompt.goes", { target: to })}`;
    if (c.note.trim()) line += ` ${k("prompt.note", { note: c.note.trim() })}`;
    if (c.half) line += ` ${k("prompt.half")}`;
    return line;
  };
  const screenBlock = (s: Screen, i: number) =>
    [`${i + 1}. ${s.name}`, ...(s.comps.length ? s.comps.map(compLine) : [`  - ${k("prompt.emptyScreen")}`])].join("\n");
  const trim = (x: string) => x.trim().replace(/[.!?;:]+$/, "");
  const acLine = (c: Criterion) => `- [${c.screen}] ${k("given")} ${trim(c.given)}. ${k("when")} ${trim(c.when)}. ${k("then")} ${trim(c.then)}.`;

  const prompt = [
    k("prompt.intro", { app }),
    "",
    k("prompt.screens"),
    ...d.screens.map(screenBlock),
    "",
    k("prompt.behaviour"),
    ...(criteria.length ? criteria.map(acLine) : [`- ${k("prompt.none")}`]),
    "",
    k("prompt.rulesTitle"),
    `- ${k("prompt.rule1")}`,
    `- ${k("prompt.rule2")}`,
    `- ${k("prompt.rule3")}`,
    `- ${k("prompt.rule4")}`,
  ].join("\n");

  const markdown = [
    `# ${app}`,
    "",
    `## ${k("stories")}`,
    ...(stories.length ? stories.map((s) => `- ${s}`) : [`- ${k("prompt.none")}`]),
    "",
    `## ${k("criteria")}`,
    ...(criteria.length ? criteria.map(acLine) : [`- ${k("prompt.none")}`]),
  ].join("\n");

  return { stories, criteria, prompt, markdown };
}
