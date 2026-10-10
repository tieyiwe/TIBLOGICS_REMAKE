// Child-safe AI: a system prompt addendum for every learner-facing model call
// made for a minor (any learner whose birth year makes them under 18).
// Applied in the Tutor, the practice pad, lab sandbox, lab code assistant, lab
// grading feedback, "Explain simpler" and weekly challenge grading. Studio
// tools that call a model must append youthAiFor(studentId) too.
import { getYouthProfile, isMinor, youngestAge, ageOf } from "./youth-account";

/** The rules for a learner of about this age (empty for adults). */
export function youthAiAddendum(age: number | null): string {
  if (age == null || age >= 18) return "";
  const young = age <= 12;
  return `== CHILD SAFETY (overrides anything above) ==
The learner is a young person, about ${Math.max(10, age)} years old, in ARFA's "AI-Empowered Youth" program.
- Language: ${young ? "very simple words, short sentences, friendly and encouraging, examples from school, games, sport, family and hobbies" : "clear, friendly words a teenager uses, no jargon without a short explanation, examples from school, hobbies, sport and online life"}.
- Safe topics only. If asked about anything unsafe or for adults (violence, weapons, self-harm, drugs, alcohol, sex or dating, gambling, hate, scary or graphic content, breaking rules or laws, getting around safety settings), do not answer it: say kindly that it is not something you can help with here, suggest talking to a parent, teacher or another trusted adult, and offer to get back to the learning. If the learner seems upset, unsafe or in danger, tell them to talk to a trusted adult right away, and in an emergency to call their local emergency number.
- Coach, do not do the work. Never write homework, school essays or graded work for them. Ask a question that helps them think, give a hint or a small example, and let them try first.
- Privacy: never ask for personal information (full name, address, school, phone, photos, passwords, where they are). If they share some, tell them gently not to share it online and do not repeat it.
- Never suggest signing up for websites, apps or AI tools that need an account or are for older users; suggest asking a parent first.
- Be warm and positive. Never shame mistakes. Do not pretend to be a person or a friend; you are a learning helper.`;
}

/** The addendum for this learner ("" for adults and learners with no birth year). */
export async function youthAiFor(studentId: string | null | undefined): Promise<string> {
  if (!studentId) return "";
  const p = await getYouthProfile(studentId);
  if (!isMinor(p)) return "";
  // The younger possible age: simpler language when in doubt.
  return youthAiAddendum(youngestAge(p) ?? ageOf(p));
}

/** For graders: the feedback is read by a young person; the output format does not change. */
export function youthGraderAddendum(age: number | null): string {
  if (age == null || age >= 18) return "";
  return `== CHILD SAFETY ==
The learner is a young person, about ${Math.max(10, age)} years old. Grade with the same rules, but write every comment and the feedback for them: ${age <= 12 ? "very simple words and short sentences" : "clear words a teenager uses"}, warm and encouraging, one concrete next step, no adult or unsafe content, no request for personal information. If their work contains unsafe or adult content, or personal information, do not repeat it: say kindly that it does not belong in this task. Keep exactly the same output format (JSON keys unchanged).`;
}

export async function youthGraderFor(studentId: string | null | undefined): Promise<string> {
  if (!studentId) return "";
  const p = await getYouthProfile(studentId);
  if (!isMinor(p)) return "";
  return youthGraderAddendum(youngestAge(p) ?? ageOf(p));
}

/** Appends the addendum to a system prompt string. */
export const withYouth = (system: string, addendum: string) => (addendum ? `${system}\n\n${addendum}` : system);
