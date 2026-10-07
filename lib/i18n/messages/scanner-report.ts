import { tri } from "./pages/_tri";

// Namespace "tools.sr.*": the website scanner's report page
// (components/scanner/ReportView.tsx), the limit screen on /tools/scanner,
// the report PDF (lib/scanner/pdf.ts) and the scanner emails
// (lib/scanner/email.ts). Under "tools." so the tools client area carries it.
// The checks themselves are in scanner-checks.ts and tools.ts ("tools.check.*").

export default tri({
  // ── Page ────────────────────────────────────────────────────────────────
  "tools.sr.page.title": ["Website report: {domain}", "Rapport du site : {domain}", "Ripoti ya tovuti: {domain}"],
  "tools.sr.page.back": ["Scan another site", "Analyser un autre site", "Chunguza tovuti nyingine"],
  "tools.sr.page.free": [
    "Free: 2 scans per website every 30 days. The full report with fixes and build ideas is optional.",
    "Gratuit : 2 analyses par site tous les 30 jours. Le rapport complet avec les correctifs et les idées est facultatif.",
    "Bure: uchunguzi 2 kwa kila tovuti kila siku 30. Ripoti kamili yenye marekebisho na mawazo ni hiari.",
  ],
  "tools.sr.recent": ["Your recent reports", "Vos rapports récents", "Ripoti zako za karibuni"],

  // ── Limit ───────────────────────────────────────────────────────────────
  "tools.sr.limit.title": [
    "{domain} has had its {n} free scans this month",
    "{domain} a déjà eu ses {n} analyses gratuites ce mois-ci",
    "{domain} imeshapata uchunguzi wake {n} wa bure mwezi huu",
  ],
  "tools.sr.limit.body": [
    "Free scans of this site open again on {date}. You can get the full report now (it includes a fresh scan), or book a free call and we'll go through the site with you.",
    "Les analyses gratuites de ce site rouvrent le {date}. Vous pouvez obtenir le rapport complet dès maintenant (il inclut une nouvelle analyse), ou réserver un appel gratuit pour passer le site en revue avec nous.",
    "Uchunguzi wa bure wa tovuti hii utafunguliwa tena {date}. Unaweza kupata ripoti kamili sasa (inajumuisha uchunguzi mpya), au kuweka miadi ya simu ya bure tuipitie tovuti pamoja.",
  ],
  "tools.sr.limit.buy": ["Get the full report: {price}", "Obtenir le rapport complet : {price}", "Pata ripoti kamili: {price}"],
  "tools.sr.limit.call": ["Book a free call", "Réserver un appel gratuit", "Weka miadi ya simu ya bure"],
  "tools.sr.limit.yours": ["Your reports for this site", "Vos rapports pour ce site", "Ripoti zako za tovuti hii"],
  "tools.sr.limit.rescanHint": [
    "Bought the full report? Its fresh scan is on the report page.",
    "Vous avez acheté le rapport complet ? Sa nouvelle analyse se trouve sur la page du rapport.",
    "Ulinunua ripoti kamili? Uchunguzi wake mpya uko kwenye ukurasa wa ripoti.",
  ],

  // ── Overview ────────────────────────────────────────────────────────────
  "tools.sr.overall": ["Overall score", "Score global", "Alama ya jumla"],
  "tools.sr.percentile": [
    "Better than {p}% of the sites we've scanned",
    "Meilleur que {p} % des sites que nous avons analysés",
    "Bora kuliko {p}% ya tovuti tulizochunguza",
  ],
  "tools.sr.builtWith": ["Built with {platform}", "Construit avec {platform}", "Imejengwa kwa {platform}"],
  "tools.sr.scannedOn": ["Scanned {date}", "Analysé le {date}", "Imechunguzwa {date}"],
  "tools.sr.areas": ["Scores by area", "Scores par domaine", "Alama kwa eneo"],
  "tools.sr.area.growth": ["Lead capture & growth", "Prospects et croissance", "Kupata wateja na ukuaji"],
  "tools.sr.area.ai": ["AI readiness", "Préparation à l'IA", "Utayari wa AI"],
  "tools.sr.area.seo": ["Search (SEO)", "Référencement (SEO)", "Utafutaji (SEO)"],
  "tools.sr.area.perf": ["Speed", "Vitesse", "Kasi"],
  "tools.sr.area.ux": ["Usability", "Ergonomie", "Urahisi wa matumizi"],
  "tools.sr.area.security": ["Security & trust", "Sécurité et confiance", "Usalama na uaminifu"],
  "tools.sr.areaShort.growth": ["Leads", "Prospects", "Wateja"],
  "tools.sr.areaShort.ai": ["AI", "IA", "AI"],
  "tools.sr.areaShort.seo": ["SEO", "SEO", "SEO"],
  "tools.sr.areaShort.perf": ["Speed", "Vitesse", "Kasi"],
  "tools.sr.areaShort.ux": ["UX", "UX", "UX"],
  "tools.sr.areaShort.security": ["Security", "Sécurité", "Usalama"],
  "tools.sr.count.none": ["No problems found", "Aucun problème", "Hakuna matatizo"],
  "tools.sr.count.one": ["1 problem", "1 problème", "Tatizo 1"],
  "tools.sr.count.other": ["{n} problems", "{n} problèmes", "Matatizo {n}"],

  // ── Problems and the email gate ─────────────────────────────────────────
  "tools.sr.top": ["The 3 biggest problems", "Les 3 plus gros problèmes", "Matatizo 3 makubwa zaidi"],
  "tools.sr.problems": ["Every problem we found ({n})", "Tous les problèmes trouvés ({n})", "Matatizo yote tuliyopata ({n})"],
  "tools.sr.problemsTotal": ["{n} in total", "{n} au total", "{n} kwa jumla"],
  "tools.sr.noProblems": ["No problems found. Nicely done.", "Aucun problème trouvé. Bravo.", "Hakuna matatizo. Kazi nzuri."],
  "tools.sr.fixLocked": ["Fix steps in the full report", "Correctif dans le rapport complet", "Hatua za kurekebisha ziko kwenye ripoti kamili"],
  "tools.sr.moreHidden": ["{n} more problems", "{n} autres problèmes", "Matatizo mengine {n}"],
  "tools.sr.email.title": ["See every problem we found", "Voir tous les problèmes trouvés", "Ona matatizo yote tuliyopata"],
  "tools.sr.email.body": [
    "Enter your email to see the full list now and get these results in your inbox.",
    "Indiquez votre e-mail pour voir la liste complète maintenant et recevoir ces résultats.",
    "Weka barua pepe yako uone orodha kamili sasa na upokee matokeo haya.",
  ],
  "tools.sr.email.send": ["Show me", "Afficher", "Nionyeshe"],
  "tools.sr.email.consent": [
    "Email me these results and a few tips to fix them. I can unsubscribe at any time.",
    "Envoyez-moi ces résultats et quelques conseils pour les corriger. Je peux me désinscrire à tout moment.",
    "Nitumie matokeo haya na vidokezo vichache vya kuyarekebisha. Ninaweza kujiondoa wakati wowote.",
  ],
  "tools.sr.email.needConsent": [
    "Please tick the box so we can email you the results.",
    "Cochez la case pour que nous puissions vous envoyer les résultats.",
    "Tafadhali weka alama kwenye kisanduku ili tukutumie matokeo.",
  ],
  "tools.sr.email.done": [
    "Done. The results are on their way to your inbox.",
    "C'est fait. Les résultats arrivent dans votre boîte de réception.",
    "Imekamilika. Matokeo yanakuja kwenye barua pepe yako.",
  ],

  // ── Unlock ──────────────────────────────────────────────────────────────
  "tools.sr.unlock.tag": ["Full report", "Rapport complet", "Ripoti kamili"],
  "tools.sr.unlock.title": [
    "Know exactly what to fix, and what to build",
    "Sachez exactement quoi corriger, et quoi construire",
    "Jua hasa nini cha kurekebisha, na nini cha kujenga",
  ],
  "tools.sr.unlock.fixes": [
    "Why each of the {n} problems matters, with step-by-step fixes in priority order",
    "Pourquoi chacun des {n} problèmes compte, avec les correctifs pas à pas, par priorité",
    "Kwa nini kila moja ya matatizo {n} ni muhimu, na hatua za kurekebisha kwa kipaumbele",
  ],
  "tools.sr.unlock.ideas": [
    "{n} things we'd build for this site to bring in more customers",
    "{n} choses que nous construirions pour ce site afin d'attirer plus de clients",
    "Mambo {n} tungejenga kwa tovuti hii ili kuleta wateja zaidi",
  ],
  "tools.sr.unlock.security": [
    "Security and email-delivery checks in detail, with the tools and versions we found",
    "Les contrôles de sécurité et de délivrabilité des e-mails en détail, avec les outils et versions détectés",
    "Ukaguzi wa usalama na uwasilishaji wa barua pepe kwa kina, pamoja na zana na matoleo tuliyopata",
  ],
  "tools.sr.unlock.pagespeed": ["Google PageSpeed test on mobile", "Test Google PageSpeed sur mobile", "Jaribio la Google PageSpeed kwenye simu"],
  "tools.sr.unlock.compare": ["Side by side with up to 3 competitors", "Comparaison avec jusqu'à 3 concurrents", "Ulinganisho na hadi washindani 3"],
  "tools.sr.unlock.pdf": [
    "A branded PDF and a link to share with your team or web developer",
    "Un PDF à nos couleurs et un lien à partager avec votre équipe ou votre développeur",
    "PDF yenye chapa na kiungo cha kushiriki na timu yako au msanidi wa tovuti",
  ],
  "tools.sr.unlock.rescan": [
    "A fresh scan within 30 days to check your fixes",
    "Une nouvelle analyse sous 30 jours pour vérifier vos corrections",
    "Uchunguzi mpya ndani ya siku 30 kuthibitisha marekebisho yako",
  ],
  "tools.sr.locked.fixes": ["Step-by-step fixes", "Correctifs pas à pas", "Hatua za kurekebisha"],
  "tools.sr.locked.ideas": ["{n} build ideas", "{n} idées de projets", "Mawazo {n} ya kujenga"],
  "tools.sr.unlock.buy": ["Unlock the full report: {price}", "Débloquer le rapport complet : {price}", "Fungua ripoti kamili: {price}"],
  "tools.sr.unlock.call": ["Or get it free with a call", "Ou gratuitement avec un appel", "Au uipate bure kwa simu"],
  "tools.sr.unlock.note": [
    "One payment, no subscription. Book a free 30-minute call instead and we'll unlock it and walk you through it.",
    "Un seul paiement, sans abonnement. Ou réservez un appel gratuit de 30 minutes : nous le débloquons et le parcourons avec vous.",
    "Malipo mara moja, hakuna usajili. Au weka miadi ya simu ya bure ya dakika 30 tuifungue na tuipitie pamoja nawe.",
  ],
  "tools.sr.held.title": ["Full report for {domain}", "Rapport complet pour {domain}", "Ripoti kamili ya {domain}"],
  "tools.sr.held.body": [
    "The site is scanned. Your report opens as soon as the payment of {price} goes through.",
    "Le site est analysé. Votre rapport s'ouvre dès que le paiement de {price} est validé.",
    "Tovuti imechunguzwa. Ripoti yako itafunguka mara malipo ya {price} yatakapokamilika.",
  ],
  "tools.sr.paid.confirming": [
    "Payment received. Opening your full report…",
    "Paiement reçu. Ouverture de votre rapport complet…",
    "Malipo yamepokelewa. Tunafungua ripoti yako kamili…",
  ],

  // ── Full report ─────────────────────────────────────────────────────────
  "tools.sr.fixPlan": ["Your fix plan", "Votre plan de correction", "Mpango wako wa marekebisho"],
  "tools.sr.summary": ["Summary", "Synthèse", "Muhtasari"],
  "tools.sr.quickWin": ["Start here:", "Commencez par ceci :", "Anza hapa:"],
  "tools.sr.effort.low": ["Quick fix", "Correction rapide", "Marekebisho ya haraka"],
  "tools.sr.effort.medium": ["Half a day", "Une demi-journée", "Nusu siku"],
  "tools.sr.effort.high": ["A project", "Un projet", "Mradi"],
  "tools.sr.diy": ["You can do this yourself", "Faisable par vous-même", "Unaweza kufanya mwenyewe"],
  "tools.sr.writing": [
    "We're writing your fix steps and build ideas. This takes about a minute; the page updates by itself.",
    "Nous rédigeons vos correctifs et vos idées. Cela prend environ une minute ; la page se met à jour toute seule.",
    "Tunaandika hatua zako za marekebisho na mawazo. Inachukua takriban dakika moja; ukurasa utajisasisha wenyewe.",
  ],
  "tools.sr.writingFailed": [
    "Writing the report is taking longer than usual. We'll email it to you as soon as it's ready.",
    "La rédaction du rapport prend plus de temps que prévu. Nous vous l'enverrons par e-mail dès qu'il sera prêt.",
    "Kuandika ripoti kunachukua muda zaidi ya kawaida. Tutakutumia kwa barua pepe ikiwa tayari.",
  ],
  "tools.sr.staffPreview": [
    "Staff preview: this report is not unlocked, so no written fix plan yet. Write it now if you need it.",
    "Aperçu équipe : ce rapport n'est pas débloqué, le plan écrit n'existe pas encore. Rédigez-le maintenant si besoin.",
    "Muonekano wa wafanyakazi: ripoti hii haijafunguliwa, kwa hiyo mpango ulioandikwa bado haupo. Uandike sasa ukiuhitaji.",
  ],
  "tools.sr.staffWrite": ["Write the fix plan", "Rédiger le plan", "Andika mpango"],
  "tools.sr.pdf": ["Download PDF", "Télécharger le PDF", "Pakua PDF"],
  "tools.sr.share": ["Copy share link", "Copier le lien", "Nakili kiungo"],
  "tools.sr.copied": ["Link copied", "Lien copié", "Kiungo kimenakiliwa"],
  "tools.sr.ideas": ["What we'd build for you", "Ce que nous construirions pour vous", "Tungekujengea nini"],
  "tools.sr.ideas.cta": ["Talk through these ideas", "Parlons de ces idées", "Tuzungumzie mawazo haya"],
  "tools.sr.outcome": ["Result:", "Résultat :", "Matokeo:"],
  "tools.sr.allChecks": ["Every check", "Tous les contrôles", "Ukaguzi wote"],
  "tools.sr.tech": ["What the site runs on", "Technologies du site", "Tovuti inatumia nini"],
  "tools.sr.tech.platform": ["Platform", "Plateforme", "Jukwaa"],
  "tools.sr.tech.shop": ["Online shop", "Boutique en ligne", "Duka la mtandaoni"],
  "tools.sr.tech.analytics": ["Analytics and ads", "Mesure d'audience et publicité", "Takwimu na matangazo"],
  "tools.sr.tech.booking": ["Booking", "Réservation", "Uwekaji miadi"],
  "tools.sr.tech.chat": ["Chat", "Chat", "Gumzo"],
  "tools.sr.tech.languages": ["Languages", "Langues", "Lugha"],
  "tools.sr.tech.libraries": ["Script libraries", "Bibliothèques de scripts", "Maktaba za skripti"],
  "tools.sr.tech.outdated": ["outdated", "obsolète", "zimepitwa na wakati"],
  "tools.sr.tech.none": ["None found", "Aucun détecté", "Hakuna kilichopatikana"],
  "tools.sr.pagespeed": ["Google PageSpeed", "Google PageSpeed", "Google PageSpeed"],
  "tools.sr.ps.mobile": ["mobile", "mobile", "simu"],
  "tools.sr.ps.performance": ["Performance (mobile)", "Performance (mobile)", "Utendaji (simu)"],
  "tools.sr.ps.pending": ["Measured when the report is written.", "Mesuré lors de la rédaction du rapport.", "Hupimwa ripoti inapoandikwa."],
  "tools.sr.ps.unavailable": [
    "Google PageSpeed could not test this site this time.",
    "Google PageSpeed n'a pas pu tester ce site cette fois-ci.",
    "Google PageSpeed haikuweza kupima tovuti hii wakati huu.",
  ],
  "tools.sr.compare": ["You vs your competitors", "Vous face à vos concurrents", "Wewe dhidi ya washindani wako"],
  "tools.sr.compare.body": [
    "Enter up to 3 competitor websites. We scan them with the same checks.",
    "Saisissez jusqu'à 3 sites concurrents. Nous les analysons avec les mêmes contrôles.",
    "Weka hadi tovuti 3 za washindani. Tunazichunguza kwa ukaguzi uleule.",
  ],
  "tools.sr.compare.placeholder": ["Competitor {n}", "Concurrent {n}", "Mshindani {n}"],
  "tools.sr.compare.run": ["Compare", "Comparer", "Linganisha"],
  "tools.sr.compare.site": ["Site", "Site", "Tovuti"],
  "tools.sr.rescan.title": ["Check your fixes", "Vérifiez vos corrections", "Thibitisha marekebisho yako"],
  "tools.sr.rescan.body": [
    "Your report includes one fresh scan of this site until {date}.",
    "Votre rapport inclut une nouvelle analyse de ce site jusqu'au {date}.",
    "Ripoti yako inajumuisha uchunguzi mmoja mpya wa tovuti hii hadi {date}.",
  ],
  "tools.sr.rescan.run": ["Scan again", "Analyser à nouveau", "Chunguza tena"],

  // ── Errors ──────────────────────────────────────────────────────────────
  "tools.sr.err.email": ["Please enter a valid email address.", "Veuillez saisir une adresse e-mail valide.", "Tafadhali weka barua pepe sahihi."],
  "tools.sr.err.notOnSale": [
    "The full report is not on sale right now. Book a free call instead.",
    "Le rapport complet n'est pas en vente pour le moment. Réservez plutôt un appel gratuit.",
    "Ripoti kamili haiuzwi kwa sasa. Weka miadi ya simu ya bure badala yake.",
  ],
  "tools.sr.err.alreadyUnlocked": ["This report is already unlocked.", "Ce rapport est déjà débloqué.", "Ripoti hii tayari imefunguliwa."],
  "tools.sr.err.locked": ["This is part of the full report.", "Cela fait partie du rapport complet.", "Hii ni sehemu ya ripoti kamili."],
  "tools.sr.err.compareInput": [
    "Enter one to three other websites to compare.",
    "Saisissez un à trois autres sites à comparer.",
    "Weka tovuti nyingine moja hadi tatu za kulinganisha.",
  ],
  "tools.sr.err.compareUsed": [
    "This report has used its competitor scans.",
    "Ce rapport a utilisé toutes ses analyses de concurrents.",
    "Ripoti hii imetumia uchunguzi wake wote wa washindani.",
  ],
  "tools.sr.err.refused": [
    "This site refused our scanner (HTTP {code}). It may block automated visits. Nothing was counted against your free scans.",
    "Ce site a refusé notre scanner (HTTP {code}). Il bloque peut-être les visites automatisées. Rien n'a été décompté de vos analyses gratuites.",
    "Tovuti hii imekataa kichunguzi chetu (HTTP {code}). Huenda inazuia ziara za kiotomatiki. Hakuna kilichohesabiwa kwenye uchunguzi wako wa bure.",
  ],
  "tools.sr.err.rescanOther": [
    "The re-scan is for the same website as the report.",
    "La nouvelle analyse concerne le même site que le rapport.",
    "Uchunguzi mpya ni kwa tovuti ileile ya ripoti.",
  ],

  // ── Why it matters (follow-up email) ────────────────────────────────────
  "tools.sr.why.growth": [
    "Visitors who can't quickly get in touch or book don't wait: they buy from the next site they find.",
    "Les visiteurs qui ne peuvent pas vous contacter ou réserver rapidement n'attendent pas : ils achètent sur le site suivant.",
    "Wageni wasioweza kuwasiliana au kuweka miadi haraka hawasubiri: wananunua kwenye tovuti inayofuata.",
  ],
  "tools.sr.why.ai": [
    "ChatGPT, Google's AI answers and other assistants can't recommend a business they can't read.",
    "ChatGPT, les réponses IA de Google et les autres assistants ne peuvent pas recommander une entreprise qu'ils ne savent pas lire.",
    "ChatGPT, majibu ya AI ya Google na wasaidizi wengine hawawezi kupendekeza biashara wasiyoweza kuisoma.",
  ],
  "tools.sr.why.seo": [
    "Search engines show your pages less often, and with weaker titles, so fewer people click through to you.",
    "Les moteurs de recherche affichent moins vos pages, avec des titres moins forts : moins de gens cliquent jusqu'à vous.",
    "Injini za utafutaji zinaonyesha kurasa zako mara chache, na kwa vichwa dhaifu, hivyo watu wachache wanakufikia.",
  ],
  "tools.sr.why.perf": [
    "Every extra second of loading loses visitors, most of all on phones.",
    "Chaque seconde de chargement en plus fait fuir des visiteurs, surtout sur mobile.",
    "Kila sekunde ya ziada ya kupakia inapoteza wageni, hasa kwenye simu.",
  ],
  "tools.sr.why.ux": [
    "When a page is hard to use on a phone or with a screen reader, people give up and leave.",
    "Quand une page est difficile à utiliser sur mobile ou avec un lecteur d'écran, les gens abandonnent.",
    "Ukurasa ukiwa mgumu kutumia kwenye simu au kwa kisoma skrini, watu hukata tamaa na kuondoka.",
  ],
  "tools.sr.why.security": [
    "Missing protections make browsers, email providers and visitors trust the site less, and can send your emails to spam.",
    "Les protections manquantes réduisent la confiance des navigateurs, des messageries et des visiteurs, et peuvent envoyer vos e-mails en spam.",
    "Kinga zinazokosekana hupunguza imani ya vivinjari, watoa huduma za barua pepe na wageni, na zinaweza kupeleka barua pepe zako kwenye spam.",
  ],

  // ── Emails ──────────────────────────────────────────────────────────────
  "tools.sr.mail.open": ["Open your report", "Ouvrir votre rapport", "Fungua ripoti yako"],
  "tools.sr.mail.book": ["Book a free call", "Réserver un appel gratuit", "Weka miadi ya simu ya bure"],
  "tools.sr.mail.why": [
    "You're receiving this because you asked for your scan results for {domain} on tiblogics.com.",
    "Vous recevez cet e-mail car vous avez demandé les résultats de l'analyse de {domain} sur tiblogics.com.",
    "Unapokea barua hii kwa sababu uliomba matokeo ya uchunguzi wa {domain} kwenye tiblogics.com.",
  ],
  "tools.sr.mail.unsubscribe": ["Unsubscribe", "Se désinscrire", "Jiondoe"],
  "tools.sr.mail.r.subject": [
    "Your website scan: {domain} scored {score}/100",
    "Votre analyse de site : {domain} obtient {score}/100",
    "Uchunguzi wa tovuti yako: {domain} imepata {score}/100",
  ],
  "tools.sr.mail.r.title": ["Here's how {domain} scored", "Voici le résultat de {domain}", "Hivi ndivyo {domain} ilivyofanya"],
  "tools.sr.mail.r.intro": [
    "You scanned {domain} with the TIBLOGICS Website Scanner. It scored {score}/100 overall, and we found {n} things holding it back.",
    "Vous avez analysé {domain} avec le scanner de sites TIBLOGICS. Score global : {score}/100, et nous avons trouvé {n} points qui le freinent.",
    "Ulichunguza {domain} kwa Kichunguzi cha Tovuti cha TIBLOGICS. Imepata {score}/100 kwa jumla, na tumepata mambo {n} yanayoizuia.",
  ],
  "tools.sr.mail.r.problems": ["What we found:", "Ce que nous avons trouvé :", "Tulichopata:"],
  "tools.sr.mail.r.unlock": [
    "The full report shows why each problem matters and how to fix it step by step, {n} things we'd build for this site, a competitor comparison and a PDF to share. It's {price} and includes a fresh scan within 30 days, or free when you book a short call with us.",
    "Le rapport complet explique pourquoi chaque problème compte et comment le corriger pas à pas, avec {n} idées de projets pour ce site, une comparaison avec vos concurrents et un PDF à partager. Il coûte {price} et inclut une nouvelle analyse sous 30 jours, ou il est gratuit si vous réservez un court appel avec nous.",
    "Ripoti kamili inaonyesha kwa nini kila tatizo ni muhimu na jinsi ya kulirekebisha hatua kwa hatua, mambo {n} tungejenga kwa tovuti hii, ulinganisho na washindani na PDF ya kushiriki. Ni {price} na inajumuisha uchunguzi mpya ndani ya siku 30, au ni bure ukiweka miadi ya simu fupi nasi.",
  ],
  "tools.sr.mail.f1.subject": ["The #1 thing holding {domain} back", "Le principal frein de {domain}", "Jambo kuu linalozuia {domain}"],
  "tools.sr.mail.f1.title": ["The #1 thing holding {domain} back", "Le principal frein de {domain}", "Jambo kuu linalozuia {domain}"],
  "tools.sr.mail.f1.intro": [
    "When you scanned {domain}, the biggest problem we found was:",
    "Lors de l'analyse de {domain}, le plus gros problème trouvé était :",
    "Ulipochunguza {domain}, tatizo kubwa zaidi tulilopata lilikuwa:",
  ],
  "tools.sr.mail.f1.more": [
    "Your full report has the exact steps to fix it, plus {n} more problems in priority order.",
    "Votre rapport complet donne les étapes exactes pour le corriger, et {n} autres problèmes par ordre de priorité.",
    "Ripoti yako kamili ina hatua kamili za kulirekebisha, pamoja na matatizo mengine {n} kwa mpangilio wa kipaumbele.",
  ],
  "tools.sr.mail.f1.cta": ["See how to fix it", "Voir comment corriger", "Ona jinsi ya kurekebisha"],
  "tools.sr.mail.f2.subject": ["{n} things we'd build for {domain}", "{n} idées de projets pour {domain}", "Mambo {n} tungejenga kwa {domain}"],
  "tools.sr.mail.f2.title": ["{n} things we'd build for {domain}", "{n} idées de projets pour {domain}", "Mambo {n} tungejenga kwa {domain}"],
  "tools.sr.mail.f2.intro": [
    "Beyond fixing problems, we looked at what would bring {domain} more customers. Here are two of our {n} ideas:",
    "Au-delà des corrections, nous avons cherché ce qui apporterait plus de clients à {domain}. Voici deux de nos {n} idées :",
    "Zaidi ya kurekebisha matatizo, tuliangalia kitakacholetea {domain} wateja zaidi. Haya ni mawazo mawili kati ya {n}:",
  ],
  "tools.sr.mail.f2.call": [
    "Book a free 30-minute call and we'll walk you through your report and these ideas, with no obligation. Or unlock the full report now for {price}.",
    "Réservez un appel gratuit de 30 minutes : nous parcourrons votre rapport et ces idées avec vous, sans engagement. Ou débloquez le rapport complet maintenant pour {price}.",
    "Weka miadi ya simu ya bure ya dakika 30 tukupitishe kwenye ripoti yako na mawazo haya, bila wajibu wowote. Au fungua ripoti kamili sasa kwa {price}.",
  ],
  "tools.sr.mail.f2.unlock": ["Unlock the full report ({price})", "Débloquer le rapport ({price})", "Fungua ripoti kamili ({price})"],
  "tools.sr.mail.ready.subject": [
    "Your full website report for {domain} is ready",
    "Votre rapport complet pour {domain} est prêt",
    "Ripoti yako kamili ya {domain} iko tayari",
  ],
  "tools.sr.mail.ready.title": ["Your full report is ready", "Votre rapport complet est prêt", "Ripoti yako kamili iko tayari"],
  "tools.sr.mail.ready.intro": [
    "Here's everything we found on {domain}: the fix steps for each problem, in priority order, and what we'd build to bring you more customers. The PDF is attached.",
    "Voici tout ce que nous avons trouvé sur {domain} : les correctifs de chaque problème, par priorité, et ce que nous construirions pour vous apporter plus de clients. Le PDF est en pièce jointe.",
    "Hiki ndicho tulichopata kwenye {domain}: hatua za kurekebisha kila tatizo kwa kipaumbele, na tungejenga nini kukuletea wateja zaidi. PDF imeambatishwa.",
  ],
  "tools.sr.mail.ready.open": ["Open the full report", "Ouvrir le rapport complet", "Fungua ripoti kamili"],
  "tools.sr.mail.ready.rescan": [
    "Your report includes one fresh scan of {domain} until {date}: use it once you've made the fixes to see the difference.",
    "Votre rapport inclut une nouvelle analyse de {domain} jusqu'au {date} : utilisez-la après vos corrections pour mesurer la différence.",
    "Ripoti yako inajumuisha uchunguzi mmoja mpya wa {domain} hadi {date}: utumie baada ya kufanya marekebisho uone tofauti.",
  ],
  "tools.sr.mail.ready.help": [
    "Rather have it done for you? Book a call and we'll take it from here.",
    "Vous préférez qu'on s'en occupe ? Réservez un appel et nous prenons le relais.",
    "Ungependa tukufanyie? Weka miadi ya simu na tutaendelea kutoka hapa.",
  ],
  "tools.sr.mail.ready.private": [
    "Anyone with the report link can open it. Share it only with people you trust.",
    "Toute personne disposant du lien peut ouvrir le rapport. Ne le partagez qu'avec des personnes de confiance.",
    "Yeyote mwenye kiungo cha ripoti anaweza kuifungua. Ishiriki na watu unaowaamini tu.",
  ],

  // ── PDF ─────────────────────────────────────────────────────────────────
  "tools.sr.pdf.title": ["Website Report", "Rapport de site web", "Ripoti ya Tovuti"],
  "tools.sr.pdf.scores": ["Scores", "Scores", "Alama"],
  "tools.sr.fix.tag": ["Done for you", "On s'en occupe", "Tunakufanyia"],
  "tools.sr.fix.title.one": ["We'll fix this issue for you", "Nous corrigeons ce problème pour vous", "Tutarekebisha tatizo hili kwa ajili yako"],
  "tools.sr.fix.title.other": ["We'll fix these {n} issues for you", "Nous corrigeons ces {n} problèmes pour vous", "Tutarekebisha matatizo haya {n} kwa ajili yako"],
  "tools.sr.fix.body": [
    "The TIBLOGICS team fixes what this report found: security settings, speed, search, lead capture and AI readiness. You keep running your business; we hand back a site that scores higher.",
    "L'équipe TIBLOGICS corrige ce que ce rapport a trouvé : sécurité, vitesse, référencement, captation de prospects et préparation à l'IA. Vous gérez votre activité, nous vous rendons un site mieux noté.",
    "Timu ya TIBLOGICS inarekebisha yaliyopatikana kwenye ripoti hii: usalama, kasi, utafutaji, kupata wateja na utayari wa AI. Wewe endelea na biashara yako; tunakurudishia tovuti yenye alama za juu.",
  ],
  "tools.sr.fix.cta": ["Get my issues fixed", "Faire corriger mes problèmes", "Nirekebishiwe matatizo"],
  "tools.sr.fix.note": [
    "Free 30-minute call: we go through this report with you and give you a fixed price and timeline.",
    "Appel gratuit de 30 minutes : nous parcourons ce rapport avec vous et vous donnons un prix fixe et un délai.",
    "Simu ya bure ya dakika 30: tunapitia ripoti hii pamoja nawe na kukupa bei maalum na muda.",
  ],
  "tools.sr.pdf.fix": [
    "We can fix the {n} issues on this report for you, at a fixed price. Book a free 30-minute call and bring this report:",
    "Nous pouvons corriger les {n} problèmes de ce rapport pour vous, à prix fixe. Réservez un appel gratuit de 30 minutes avec ce rapport :",
    "Tunaweza kukurekebishia matatizo {n} yaliyo kwenye ripoti hii, kwa bei maalum. Weka simu ya bure ya dakika 30 ukiwa na ripoti hii:",
  ],
  "tools.sr.pdf.next": ["Want it done for you?", "Vous voulez qu'on s'en occupe ?", "Ungependa tukufanyie?"],
  "tools.sr.pdf.nextBody": [
    "TIBLOGICS builds AI and software for businesses: websites, booking and lead capture, AI assistants and automation. Book a free 30-minute call:",
    "TIBLOGICS conçoit l'IA et les logiciels des entreprises : sites web, réservation et prospects, assistants IA et automatisation. Réservez un appel gratuit de 30 minutes :",
    "TIBLOGICS hujenga AI na programu kwa biashara: tovuti, uwekaji miadi na kupata wateja, wasaidizi wa AI na otomatiki. Weka miadi ya simu ya bure ya dakika 30:",
  ],
});
