import type { Messages } from "./types";

// Namespaces "drafts", "resume" and "updates": autosaved work in progress,
// "Continue where you left off", the reading position in a lesson, and
// lessons added to a track after the learner finished a module.
// See lib/i18n/README.md. French uses a narrow no-break space before : ; ? !.
const NB = " ";

const messages: Messages = {
  en: {
    "drafts.saving": "Saving…",
    "drafts.saved": "Saved",
    "drafts.local": "Offline: saved on this device",
    "drafts.restored": "Your saved work is back",

    "resume.title": "Continue where you left off",
    "resume.kind.lesson": "Lesson in progress",
    "resume.kind.next": "Next lesson",
    "resume.kind.lab": "Lab in progress",
    "resume.kind.code": "Code Studio in progress",
    "resume.kind.exam": "Final exam in progress",
    "resume.kind.studio": "Learning Studio in progress",
    "resume.kind.capstone": "Capstone draft",
    "resume.cta": "Continue",
    "resume.jumpBack": "Jump back to where you were",
    "resume.jumpBackBody": "Last time you got {pct}% of the way through this lesson.",
    "resume.dismiss": "Stay at the top",

    "updates.title": "New in this track",
    "updates.body.one": "1 lesson was added to a module you had finished. Your progress and certificates are unchanged.",
    "updates.body.other": "{n} lessons were added to modules you had finished. Your progress and certificates are unchanged.",
    "updates.badge": "New",
    "updates.dash.one": "1 new lesson",
    "updates.dash.other": "{n} new lessons",
  },
  fr: {
    "drafts.saving": "Enregistrement…",
    "drafts.saved": "Enregistré",
    "drafts.local": `Hors ligne${NB}: enregistré sur cet appareil`,
    "drafts.restored": "Votre travail enregistré est de retour",

    "resume.title": "Reprendre là où vous vous êtes arrêté",
    "resume.kind.lesson": "Leçon en cours",
    "resume.kind.next": "Leçon suivante",
    "resume.kind.lab": "Atelier en cours",
    "resume.kind.code": "Code Studio en cours",
    "resume.kind.exam": "Examen final en cours",
    "resume.kind.studio": "Learning Studio en cours",
    "resume.kind.capstone": "Brouillon du projet final",
    "resume.cta": "Continuer",
    "resume.jumpBack": "Revenir là où vous étiez",
    "resume.jumpBackBody": "La dernière fois, vous en étiez à {pct} % de cette leçon.",
    "resume.dismiss": "Rester en haut",

    "updates.title": "Nouveau dans ce parcours",
    "updates.body.one": "1 leçon a été ajoutée à un module que vous aviez terminé. Votre progression et vos certificats ne changent pas.",
    "updates.body.other": "{n} leçons ont été ajoutées à des modules que vous aviez terminés. Votre progression et vos certificats ne changent pas.",
    "updates.badge": "Nouveau",
    "updates.dash.one": "1 nouvelle leçon",
    "updates.dash.other": "{n} nouvelles leçons",
  },
  sw: {
    "drafts.saving": "Inahifadhi…",
    "drafts.saved": "Imehifadhiwa",
    "drafts.local": "Nje ya mtandao: imehifadhiwa kwenye kifaa hiki",
    "drafts.restored": "Kazi yako iliyohifadhiwa imerudi",

    "resume.title": "Endelea ulipoachia",
    "resume.kind.lesson": "Somo linaloendelea",
    "resume.kind.next": "Somo linalofuata",
    "resume.kind.lab": "Maabara inayoendelea",
    "resume.kind.code": "Code Studio inayoendelea",
    "resume.kind.exam": "Mtihani wa mwisho unaoendelea",
    "resume.kind.studio": "Learning Studio inayoendelea",
    "resume.kind.capstone": "Rasimu ya mradi wa mwisho",
    "resume.cta": "Endelea",
    "resume.jumpBack": "Rudi ulipokuwa",
    "resume.jumpBackBody": "Mara ya mwisho ulifika {pct}% ya somo hili.",
    "resume.dismiss": "Baki juu",

    "updates.title": "Mapya katika mkondo huu",
    "updates.body.one": "Somo 1 limeongezwa kwenye moduli uliyokuwa umemaliza. Maendeleo na vyeti vyako havibadiliki.",
    "updates.body.other": "Masomo {n} yameongezwa kwenye moduli ulizokuwa umemaliza. Maendeleo na vyeti vyako havibadiliki.",
    "updates.badge": "Jipya",
    "updates.dash.one": "Somo 1 jipya",
    "updates.dash.other": "Masomo {n} mapya",
  },
};

export default messages;
