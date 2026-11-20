import type { Messages } from "./types";

// Namespace "tools.sr.out": the website report the TIBLOGICS team sends to a
// site's owner from the admin scanner (lib/scanner/outreach.ts). Plain
// punctuation only.

const messages: Messages = {
  en: {
    "tools.sr.out.defaultNote":
      "We ran a free check of {domain}: speed, search visibility, AI readiness, lead capture and security. The results are below, including a few things worth fixing soon.\n\nEach problem has a link if you would like us to fix it for you, or you can book a free call and we will walk you through the report.",
    "tools.sr.out.hello": "Hello {name},",
    "tools.sr.out.helloNoName": "Hello,",
    "tools.sr.out.title": "Website report for {domain}",
    "tools.sr.out.security": "Security grade: {grade}",
    "tools.sr.out.site": "Other things to improve ({n})",
    "tools.sr.out.nextTitle": "What we can do",
    "tools.sr.out.next":
      "TIBLOGICS can fix all of this for you, starting with the most serious issues. Tap \"Fix this for me\" next to any problem, ask us to fix everything, or book a free call to go through the report together.",
    "tools.sr.out.open": "Open the full report",
    "tools.sr.out.signoff": "Best regards,",
    "tools.sr.out.why":
      "TIBLOGICS checked the public pages of {domain}, the way any visitor's browser sees them, and a member of our team sent you the results. You will not get further emails from this check unless you reply.",
    "tools.sr.out.subject": "Website report for {domain}: {score}/100",
    "tools.sr.out.subjectSec": "{domain}: {n} security issues worth fixing, and your full website report",
  },
  fr: {
    "tools.sr.out.defaultNote":
      "Nous avons fait un contrôle gratuit de {domain} : vitesse, visibilité dans les moteurs de recherche, préparation à l'IA, captation de prospects et sécurité. Les résultats sont ci-dessous, avec quelques points à corriger rapidement.\n\nChaque problème a un lien si vous souhaitez que nous le corrigions pour vous, ou réservez un appel gratuit et nous vous présenterons le rapport.",
    "tools.sr.out.hello": "Bonjour {name},",
    "tools.sr.out.helloNoName": "Bonjour,",
    "tools.sr.out.title": "Rapport du site {domain}",
    "tools.sr.out.security": "Note de sécurité : {grade}",
    "tools.sr.out.site": "Autres points à améliorer ({n})",
    "tools.sr.out.nextTitle": "Ce que nous pouvons faire",
    "tools.sr.out.next":
      "TIBLOGICS peut tout corriger pour vous, en commençant par les problèmes les plus graves. Touchez « Corrigez-le pour moi » à côté d'un problème, demandez-nous de tout corriger, ou réservez un appel gratuit pour parcourir le rapport ensemble.",
    "tools.sr.out.open": "Ouvrir le rapport complet",
    "tools.sr.out.signoff": "Cordialement,",
    "tools.sr.out.why":
      "TIBLOGICS a vérifié les pages publiques de {domain}, comme les voit le navigateur de n'importe quel visiteur, et un membre de notre équipe vous a envoyé les résultats. Vous ne recevrez pas d'autres e-mails à ce sujet sauf si vous répondez.",
    "tools.sr.out.subject": "Rapport du site {domain} : {score}/100",
    "tools.sr.out.subjectSec": "{domain} : {n} problèmes de sécurité à corriger, et votre rapport complet",
  },
  sw: {
    "tools.sr.out.defaultNote":
      "Tumefanya ukaguzi wa bure wa {domain}: kasi, kuonekana kwenye injini za utafutaji, utayari wa AI, kupata wateja na usalama. Matokeo yako hapa chini, pamoja na mambo machache ya kurekebisha mapema.\n\nKila tatizo lina kiungo kama ungependa tukurekebishie, au weka simu ya bure tukupitishe kwenye ripoti.",
    "tools.sr.out.hello": "Habari {name},",
    "tools.sr.out.helloNoName": "Habari,",
    "tools.sr.out.title": "Ripoti ya tovuti ya {domain}",
    "tools.sr.out.security": "Daraja la usalama: {grade}",
    "tools.sr.out.site": "Mambo mengine ya kuboresha ({n})",
    "tools.sr.out.nextTitle": "Tunachoweza kufanya",
    "tools.sr.out.next":
      "TIBLOGICS inaweza kurekebisha haya yote kwa ajili yako, kuanzia na matatizo makubwa zaidi. Gusa \"Nirekebishie hili\" karibu na tatizo lolote, tuombe turekebishe yote, au weka simu ya bure tupitie ripoti pamoja.",
    "tools.sr.out.open": "Fungua ripoti kamili",
    "tools.sr.out.signoff": "Wako,",
    "tools.sr.out.why":
      "TIBLOGICS ilikagua kurasa za umma za {domain}, jinsi kivinjari cha mgeni yeyote kinavyoziona, na mwanatimu wetu amekutumia matokeo. Hutapokea barua pepe nyingine kuhusu ukaguzi huu isipokuwa ukijibu.",
    "tools.sr.out.subject": "Ripoti ya tovuti ya {domain}: {score}/100",
    "tools.sr.out.subjectSec": "{domain}: matatizo {n} ya usalama ya kurekebisha, na ripoti yako kamili ya tovuti",
  },
};

export default messages;
