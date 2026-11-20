import type { Messages } from "./types";

// Namespace "common". Keys are "common.something". See lib/i18n/README.md.
const messages: Messages = {
  en: {
    "common.language": "Language",
    "common.translationPending": "This page is being translated. You are seeing the English version for now; refresh in a minute.",
    "common.machineTranslated": "Translated automatically from English.",
    "common.aiDailyLimit": "You have reached today's limit for AI features. It resets within 24 hours; your work is saved.",
  },
  fr: {
    "common.language": "Langue",
    "common.translationPending": "Cette page est en cours de traduction. Vous voyez la version anglaise pour le moment ; actualisez dans une minute.",
    "common.machineTranslated": "Traduit automatiquement de l'anglais.",
    "common.aiDailyLimit": "Vous avez atteint la limite quotidienne des fonctions d'IA. Elle se réinitialise sous 24 heures ; votre travail est enregistré.",
  },
  sw: {
    "common.language": "Lugha",
    "common.translationPending": "Ukurasa huu unatafsiriwa. Kwa sasa unaona toleo la Kiingereza; onyesha upya baada ya dakika moja.",
    "common.machineTranslated": "Imetafsiriwa kiotomatiki kutoka Kiingereza.",
    "common.aiDailyLimit": "Umefikia kikomo cha leo cha huduma za AI. Kinarudi ndani ya saa 24; kazi yako imehifadhiwa.",
  },
};

export default messages;
