import type { Messages } from "./types";
import { RULES } from "@/lib/toolkit/guard/rules";

// Namespace "toolkit". Keys are "toolkit.something". See lib/i18n/README.md.
// The Toolkit Live app for subscribers (app/toolkit), its API messages, and
// the names that come from data: industries, prompt categories and the
// Compliance Guard rule explanations. Prompts themselves are long content
// (lib/i18n/sources/toolkit.ts).
//
// Each row is [key, English, French, Swahili].

type Row = [string, string, string, string];

const UI: Row[] = [
  // ── Header and plan picker ──
  ["toolkit.shell.signOut", "Sign out", "Se déconnecter", "Toka"],
  ["toolkit.sub.welcome", "Payment received. Your plan activates as soon as Stripe confirms it, usually within a few seconds.", "Paiement reçu. Votre formule sera activée dès que Stripe l'aura confirmée, en général en quelques secondes.", "Malipo yamepokelewa. Mpango wako utaanza kufanya kazi mara Stripe itakapothibitisha, kwa kawaida ndani ya sekunde chache."],
  ["toolkit.sub.refresh", "Refresh", "Actualiser", "Onyesha upya"],
  ["toolkit.sub.ended", "Your previous subscription has ended. Your history and business profile are kept if you come back.", "Votre abonnement précédent est terminé. Votre historique et votre profil d'entreprise sont conservés si vous revenez.", "Usajili wako wa awali umekwisha. Historia yako na wasifu wa biashara yako vimehifadhiwa ukirudi."],
  ["toolkit.sub.title", "Choose your plan", "Choisissez votre formule", "Chagua mpango wako"],
  ["toolkit.sub.subtitle", "Monthly, cancel anytime.", "Mensuel, résiliable à tout moment.", "Kila mwezi, unaweza kusitisha wakati wowote."],
  ["toolkit.sub.runs", "{n} AI runs a month", "{n} utilisations de l'IA par mois", "Matumizi {n} ya AI kwa mwezi"],
  ["toolkit.sub.perMonth", "/ month", "/ mois", "/ mwezi"],
  ["toolkit.sub.subscribe", "Subscribe", "S'abonner", "Jisajili"],
  ["toolkit.sub.soon", "Opening soon", "Bientôt disponible", "Inakuja hivi karibuni"],
  ["toolkit.sub.checkoutFailed", "Could not start checkout.", "Impossible de lancer le paiement.", "Imeshindwa kuanza malipo."],
  ["toolkit.plan.toolkit.blurb", "Every prompt from our industry toolkits, filled in with your business details, with Compliance Guard checking every draft.", "Tous les prompts de nos kits par secteur, remplis avec les informations de votre entreprise, et Compliance Guard qui vérifie chaque brouillon.", "Kila prompt kutoka kwenye vifurushi vyetu vya sekta, vikijazwa taarifa za biashara yako, huku Compliance Guard ikikagua kila rasimu."],
  ["toolkit.plan.guard.blurb", "Paste any draft, from any tool, and see the phrases that can get your business in trouble before it goes out.", "Collez n'importe quel brouillon, rédigé avec n'importe quel outil, et repérez les formulations qui peuvent causer des ennuis à votre entreprise avant qu'il ne parte.", "Bandika rasimu yoyote, kutoka zana yoyote, na uone maneno yanayoweza kuiletea biashara yako matatizo kabla haijatumwa."],

  // ── Workspace ──
  ["toolkit.ws.welcome", "You're subscribed to {plan}. Start by filling in your business profile so every draft sounds like you.", "Vous êtes abonné à {plan}. Commencez par remplir votre profil d'entreprise pour que chaque brouillon vous ressemble.", "Umejisajili kwenye {plan}. Anza kwa kujaza wasifu wa biashara yako ili kila rasimu isikike kama wewe."],
  ["toolkit.ws.pastDue", "Your last payment failed. Update your card under Manage billing to keep access.", "Votre dernier paiement a échoué. Mettez à jour votre carte dans Gérer la facturation pour garder l'accès.", "Malipo yako ya mwisho hayakufaulu. Sasisha kadi yako kwenye Dhibiti malipo ili uendelee kupata huduma."],
  ["toolkit.ws.endsOn", "Your plan is set to end on {date}.", "Votre formule prendra fin le {date}.", "Mpango wako utaisha tarehe {date}."],
  ["toolkit.ws.runsLeft", "{left} of {total} AI runs left this month. The instant compliance check is unlimited.", "{left} utilisations de l'IA restantes sur {total} ce mois-ci. La vérification instantanée de conformité est illimitée.", "Matumizi {left} kati ya {total} ya AI yamebaki mwezi huu. Ukaguzi wa papo hapo wa uzingatiaji wa sheria hauna kikomo."],
  ["toolkit.ws.manageBilling", "Manage billing", "Gérer la facturation", "Dhibiti malipo"],
  ["toolkit.ws.billingFailed", "Could not open billing.", "Impossible d'ouvrir la facturation.", "Imeshindwa kufungua malipo."],
  ["toolkit.tab.write", "Write", "Rédiger", "Andika"],
  ["toolkit.tab.guard", "Compliance Guard", "Compliance Guard", "Compliance Guard"],
  ["toolkit.tab.profile", "Business profile", "Profil d'entreprise", "Wasifu wa biashara"],
  ["toolkit.tab.history", "History", "Historique", "Historia"],
  ["toolkit.err.network", "Could not reach the server.", "Impossible de joindre le serveur.", "Imeshindwa kufikia seva."],

  // ── Write tab ──
  ["toolkit.write.industry", "Industry", "Secteur", "Sekta"],
  ["toolkit.write.privacy", "Do not enter names or details that identify a patient, client, claimant or employee. Use placeholders and fill them in after.", "Ne saisissez aucun nom ni détail permettant d'identifier un patient, un client, un demandeur ou un salarié. Utilisez des espaces réservés et complétez-les ensuite.", "Usiweke majina au maelezo yanayomtambulisha mgonjwa, mteja, mdai au mfanyakazi. Tumia nafasi za kujaza baadaye, kisha uzijaze wewe mwenyewe."],
  ["toolkit.write.category", "Category", "Catégorie", "Kategoria"],
  ["toolkit.write.allCategories", "All categories", "Toutes les catégories", "Kategoria zote"],
  ["toolkit.write.searchPlaceholder", "Search by keyword, e.g. late payment", "Rechercher par mot-clé, p. ex. retard de paiement", "Tafuta kwa neno, k.m. malipo yaliyochelewa"],
  ["toolkit.write.searchAll", "Search all industries", "Rechercher dans tous les secteurs", "Tafuta katika sekta zote"],
  ["toolkit.write.searching", "Searching…", "Recherche…", "Inatafuta…"],
  ["toolkit.write.didYouMean", "Did you mean {q}?", "Vouliez-vous dire {q} ?", "Ulimaanisha {q}?"],
  ["toolkit.write.noMatch", "Nothing matches “{q}”.", "Aucun résultat pour « {q} ».", "Hakuna kinacholingana na “{q}”."],
  ["toolkit.write.noMatchIndustry", "Nothing matches “{q}” in this industry.", "Aucun résultat pour « {q} » dans ce secteur.", "Hakuna kinacholingana na “{q}” katika sekta hii."],
  ["toolkit.write.bestMatches", "Best matches", "Meilleurs résultats", "Yanayolingana zaidi"],
  ["toolkit.write.closeMatches", "Close matches", "Résultats proches", "Yanayokaribiana"],
  ["toolkit.write.copyTitle", "Copy this prompt", "Copier ce prompt", "Nakili prompt hii"],
  ["toolkit.write.copyAria", "Copy the prompt: {title}", "Copier le prompt : {title}", "Nakili prompt: {title}"],
  ["toolkit.write.copyFailed", "Could not copy that prompt.", "Impossible de copier ce prompt.", "Imeshindwa kunakili prompt hiyo."],
  ["toolkit.write.openFailed", "Could not open that prompt.", "Impossible d'ouvrir ce prompt.", "Imeshindwa kufungua prompt hiyo."],
  ["toolkit.write.empty", "Pick a prompt on the left. Fill in what you know; anything you leave blank is taken from your business profile or kept as a placeholder.", "Choisissez un prompt à gauche. Remplissez ce que vous savez ; ce que vous laissez vide est repris de votre profil d'entreprise ou conservé comme espace réservé.", "Chagua prompt upande wa kushoto. Jaza unachokijua; chochote utakachoacha wazi kitachukuliwa kutoka kwenye wasifu wa biashara yako au kitabaki kama nafasi ya kujaza."],
  ["toolkit.write.useWhen", "Use this when:", "À utiliser quand :", "Tumia hii wakati:"],
  ["toolkit.write.thePrompt", "The prompt", "Le prompt", "Prompt"],
  ["toolkit.write.copied", "Copied", "Copié", "Imenakiliwa"],
  ["toolkit.write.copyPrompt", "Copy prompt", "Copier le prompt", "Nakili prompt"],
  ["toolkit.write.copyHelp", "Copies with the fields you've filled in below. Use it in any AI tool, or press “{button}” to have it written here with your business profile and a compliance check.", "La copie inclut les champs remplis ci-dessous. Utilisez-le dans n'importe quel outil d'IA, ou cliquez sur « {button} » pour le faire rédiger ici avec votre profil d'entreprise et une vérification de conformité.", "Inanakiliwa pamoja na sehemu ulizojaza hapa chini. Itumie kwenye zana yoyote ya AI, au bonyeza “{button}” ili iandikwe hapa ukitumia wasifu wa biashara yako na ukaguzi wa uzingatiaji wa sheria."],
  ["toolkit.write.example", "e.g. {x}", "p. ex. {x}", "k.m. {x}"],
  ["toolkit.write.fieldPlaceholder", "From your profile, or leave blank", "Depuis votre profil, ou laissez vide", "Kutoka kwenye wasifu wako, au acha wazi"],
  ["toolkit.write.extra", "Anything else it should know (optional)", "Autre chose à savoir (facultatif)", "Jambo lingine inalopaswa kujua (si lazima)"],
  ["toolkit.write.extraPlaceholder", "Paste the lead's message, the listing details, the numbers…", "Collez le message du prospect, les détails de l'annonce, les chiffres…", "Bandika ujumbe wa mteja mtarajiwa, maelezo ya tangazo, takwimu…"],
  ["toolkit.write.proTip", "Pro tip:", "Conseil de pro :", "Kidokezo:"],
  ["toolkit.write.run", "Write it", "Rédiger", "Iandike"],
  ["toolkit.write.running", "Writing…", "Rédaction…", "Inaandika…"],
  ["toolkit.write.genFailed", "Generation failed.", "La rédaction a échoué.", "Uandishi umeshindwa."],
  ["toolkit.write.draft", "Your draft", "Votre brouillon", "Rasimu yako"],
  ["toolkit.write.copy", "Copy", "Copier", "Nakili"],
  ["toolkit.write.englishPrompt", "This prompt is shown in English while its category is translated. You can use it now; your draft will still be written in your language.", "Ce prompt s'affiche en anglais pendant la traduction de sa catégorie. Vous pouvez l'utiliser dès maintenant ; votre brouillon sera tout de même rédigé dans votre langue.", "Prompt hii inaonyeshwa kwa Kiingereza wakati kategoria yake inatafsiriwa. Unaweza kuitumia sasa; rasimu yako bado itaandikwa kwa lugha yako."],

  // ── Compliance Guard ──
  ["toolkit.guard.deep", "Deep check (1 run)", "Vérification approfondie (1 utilisation)", "Ukaguzi wa kina (matumizi 1)"],
  ["toolkit.guard.deepFailed", "The deep check failed.", "La vérification approfondie a échoué.", "Ukaguzi wa kina umeshindwa."],
  ["toolkit.guard.checkFailed", "The check failed.", "La vérification a échoué.", "Ukaguzi umeshindwa."],
  ["toolkit.guard.industryRules", "Industry rules to apply", "Règles du secteur à appliquer", "Kanuni za sekta za kutumia"],
  ["toolkit.guard.textLabel", "Text to check", "Texte à vérifier", "Maandishi ya kukagua"],
  ["toolkit.guard.placeholder", "Paste a listing, an email, a post, an ad…", "Collez une annonce, un email, une publication, une publicité…", "Bandika tangazo la mali, email, chapisho, tangazo…"],
  ["toolkit.guard.chars", "{n} / {max} characters", "{n} / {max} caractères", "Herufi {n} / {max}"],
  ["toolkit.guard.checkNow", "Check now", "Vérifier maintenant", "Kagua sasa"],
  ["toolkit.guard.help", "“{check}” runs our phrase rules instantly and is unlimited. A deep check adds an AI review for risks that depend on context. Compliance Guard is a screening tool, not legal advice.", "« {check} » applique instantanément nos règles de formulation, sans limite. La vérification approfondie ajoute une analyse par l'IA pour les risques qui dépendent du contexte. Compliance Guard est un outil de repérage, pas un avis juridique.", "“{check}” hutumia kanuni zetu za maneno papo hapo na haina kikomo. Ukaguzi wa kina huongeza mapitio ya AI kwa hatari zinazotegemea muktadha. Compliance Guard ni zana ya uchunguzi wa awali, si ushauri wa kisheria."],
  ["toolkit.guard.englishNote", "The instant rule check reads English text only; the rules and suggested rewrites are for US English wording. The deep check works in any language.", "La vérification instantanée par règles ne lit que les textes en anglais ; ses règles et reformulations proposées portent sur des formulations en anglais américain. La vérification approfondie fonctionne dans toutes les langues.", "Ukaguzi wa papo hapo kwa kanuni husoma maandishi ya Kiingereza pekee; kanuni zake na mapendekezo ya kuandika upya ni ya maneno ya Kiingereza cha Marekani. Ukaguzi wa kina hufanya kazi kwa lugha yoyote."],
  ["toolkit.guard.draftNote", "Your draft is not in English, so the instant rule check cannot read it. Run a deep check to review it.", "Votre brouillon n'est pas en anglais : la vérification instantanée par règles ne peut pas le lire. Lancez une vérification approfondie pour l'examiner.", "Rasimu yako haiko kwa Kiingereza, kwa hiyo ukaguzi wa papo hapo kwa kanuni hauwezi kuisoma. Fanya ukaguzi wa kina ili kuipitia."],
  ["toolkit.find.none", "Nothing flagged. That is not a legal clearance; read it through before it goes out.", "Rien n'a été signalé. Ce n'est pas une validation juridique ; relisez le texte avant sa diffusion.", "Hakuna kilichowekewa alama. Hiyo si idhini ya kisheria; lisome kwa makini kabla halijatumwa."],
  ["toolkit.find.aiReview", "AI review", "Analyse IA", "Mapitio ya AI"],
  ["toolkit.find.try", "Try:", "Essayez :", "Jaribu:"],

  // ── Business profile ──
  ["toolkit.profile.intro", "This is what the writer knows about you. The more specific it is, the less you have to fill in each time.", "Voici ce que le rédacteur sait de vous. Plus c'est précis, moins vous aurez à remplir à chaque fois.", "Hiki ndicho mwandishi anachojua kukuhusu. Kadiri kinavyokuwa mahususi zaidi, ndivyo utakavyojaza kidogo kila mara."],
  ["toolkit.profile.saved", "Saved. Every draft now uses these details.", "Enregistré. Chaque brouillon utilise désormais ces informations.", "Imehifadhiwa. Kila rasimu sasa itatumia taarifa hizi."],
  ["toolkit.profile.saveFailed", "Could not save.", "Impossible d'enregistrer.", "Imeshindwa kuhifadhi."],
  ["toolkit.profile.save", "Save profile", "Enregistrer le profil", "Hifadhi wasifu"],
  ["toolkit.profile.businessName", "Business name", "Nom de l'entreprise", "Jina la biashara"],
  ["toolkit.profile.businessName.hint", "Rivera Realty Group", "Diallo Immobilier", "Mwangi Realty Group"],
  ["toolkit.profile.vertical", "Industry", "Secteur", "Sekta"],
  ["toolkit.profile.location", "Where you work", "Où vous travaillez", "Mahali unapofanya kazi"],
  ["toolkit.profile.location.hint", "Austin, Texas", "Dakar, Sénégal", "Nairobi, Kenya"],
  ["toolkit.profile.voice", "Your voice", "Votre ton", "Mtindo wako wa sauti"],
  ["toolkit.profile.voice.hint", "Warm, plain-spoken, no jargon", "Chaleureux, direct, sans jargon", "Mchangamfu, wa moja kwa moja, bila istilahi ngumu"],
  ["toolkit.profile.audience", "Your customers", "Vos clients", "Wateja wako"],
  ["toolkit.profile.audience.hint", "First-time buyers and downsizing retirees in central Austin", "Primo-accédants et retraités qui cherchent plus petit, au centre de Dakar", "Wanunuzi wa mara ya kwanza na wastaafu wanaohamia nyumba ndogo katikati ya Nairobi"],
  ["toolkit.profile.offer", "What you sell", "Ce que vous vendez", "Unachouza"],
  ["toolkit.profile.offer.hint", "Residential buying and selling, relocation help", "Achat et vente de logements, aide à la relocalisation", "Kununua na kuuza nyumba za makazi, msaada wa kuhamia"],
  ["toolkit.profile.differentiators", "What sets you apart", "Ce qui vous distingue", "Kinachokutofautisha"],
  ["toolkit.profile.differentiators.hint", "15 years in Travis County; bilingual (English/Spanish)", "15 ans d'expérience à Dakar ; bilingue (français/wolof)", "Miaka 15 jijini Nairobi; tunazungumza lugha mbili (Kiswahili/Kiingereza)"],
  ["toolkit.profile.compliance", "Required disclosures and licensing", "Mentions obligatoires et agréments", "Ufichuzi unaotakiwa na leseni"],
  ["toolkit.profile.compliance.hint", "Brokerage: Rivera Realty Group, TREC #0000000. Equal Housing Opportunity.", "Agence : Diallo Immobilier, carte professionnelle n° 0000000.", "Wakala: Mwangi Realty Group, leseni Na. 0000000."],

  // ── History ──
  ["toolkit.history.empty", "Nothing yet. Your drafts and checks appear here.", "Rien pour l'instant. Vos brouillons et vérifications apparaîtront ici.", "Bado hakuna kitu. Rasimu na ukaguzi wako vitaonekana hapa."],
  ["toolkit.history.flags.one", "{n} flag", "{n} signalement", "Alama {n}"],
  ["toolkit.history.flags.other", "{n} flags", "{n} signalements", "Alama {n}"],
  ["toolkit.history.check", "Check · {industry}", "Vérification · {industry}", "Ukaguzi · {industry}"],
  ["toolkit.history.deepCheck", "Deep check · {industry}", "Vérification approfondie · {industry}", "Ukaguzi wa kina · {industry}"],

  // ── API messages ──
  ["toolkit.api.signIn", "Sign in first.", "Connectez-vous d'abord.", "Ingia kwanza."],
  ["toolkit.api.signInToolkit", "Sign in to use Toolkit Live.", "Connectez-vous pour utiliser Toolkit Live.", "Ingia ili utumie Toolkit Live."],
  ["toolkit.api.needSub", "This needs an active subscription.", "Un abonnement actif est nécessaire.", "Hii inahitaji usajili unaoendelea."],
  ["toolkit.api.libraryPlan", "The prompt library is part of Toolkit Live. Your plan includes Compliance Guard.", "La bibliothèque de prompts fait partie de Toolkit Live. Votre formule comprend Compliance Guard.", "Maktaba ya prompt ni sehemu ya Toolkit Live. Mpango wako unajumuisha Compliance Guard."],
  ["toolkit.api.slowDown", "Slow down a little. Try again in a minute.", "Ralentissez un peu. Réessayez dans une minute.", "Punguza kasi kidogo. Jaribu tena baada ya dakika moja."],
  ["toolkit.api.tooManySearches", "Too many searches. Slow down a little.", "Trop de recherches. Ralentissez un peu.", "Utafutaji mwingi mno. Punguza kasi kidogo."],
  ["toolkit.api.pasteText", "Paste the text to check", "Collez le texte à vérifier", "Bandika maandishi ya kukagua"],
  ["toolkit.api.tooLong", "Checks are limited to {n} characters", "Les vérifications sont limitées à {n} caractères", "Ukaguzi una kikomo cha herufi {n}"],
  ["toolkit.api.deepLimit", "You've used all {n} deep checks for this month. The instant check still works.", "Vous avez utilisé vos {n} vérifications approfondies de ce mois. La vérification instantanée fonctionne toujours.", "Umetumia ukaguzi wote {n} wa kina wa mwezi huu. Ukaguzi wa papo hapo bado unafanya kazi."],
  ["toolkit.api.declinedReview", "The AI declined to review this text.", "L'IA a refusé d'examiner ce texte.", "AI imekataa kupitia maandishi haya."],
  ["toolkit.api.deepFailed", "The deep check failed. The instant check results are below.", "La vérification approfondie a échoué. Les résultats de la vérification instantanée figurent ci-dessous.", "Ukaguzi wa kina umeshindwa. Matokeo ya ukaguzi wa papo hapo yako hapa chini."],
  ["toolkit.api.runsLimit", "You've used all {n} runs for this month. They reset on the 1st.", "Vous avez utilisé vos {n} utilisations de ce mois. Elles sont renouvelées le 1er du mois.", "Umetumia matumizi yote {n} ya mwezi huu. Yanaanza upya tarehe 1."],
  ["toolkit.api.choosePrompt", "Choose a prompt", "Choisissez un prompt", "Chagua prompt"],
  ["toolkit.api.declinedGen", "The AI declined this one. Try rewording your notes.", "L'IA a refusé cette demande. Essayez de reformuler vos notes.", "AI imekataa ombi hili. Jaribu kuandika maelezo yako kwa njia nyingine."],
  ["toolkit.api.genFailed", "Generation failed. Please try again.", "La rédaction a échoué. Veuillez réessayer.", "Uandishi umeshindwa. Tafadhali jaribu tena."],
  ["toolkit.api.notFound", "Not found", "Introuvable", "Haikupatikana"],
  ["toolkit.api.noBilling", "No billing account found.", "Aucun compte de facturation trouvé.", "Hakuna akaunti ya malipo iliyopatikana."],
  ["toolkit.api.billingFailed", "Could not open billing. Please try again.", "Impossible d'ouvrir la facturation. Veuillez réessayer.", "Imeshindwa kufungua malipo. Tafadhali jaribu tena."],
  ["toolkit.api.tooManyAttempts", "Too many attempts. Try again later.", "Trop de tentatives. Réessayez plus tard.", "Majaribio mengi mno. Jaribu tena baadaye."],
  ["toolkit.api.choosePlan", "Choose a plan", "Choisissez une formule", "Chagua mpango"],
  ["toolkit.api.notOnSale", "{plan} is not on sale yet.", "{plan} n'est pas encore en vente.", "{plan} bado haijaanza kuuzwa."],
  ["toolkit.api.paymentsOff", "Payments are not configured yet.", "Les paiements ne sont pas encore configurés.", "Malipo bado hayajawekwa."],
  ["toolkit.api.alreadySubscribed", "You already have a subscription. To switch plans, cancel it under Manage billing, then choose the other plan.", "Vous avez déjà un abonnement. Pour changer de formule, résiliez-le dans Gérer la facturation, puis choisissez l'autre formule.", "Tayari una usajili. Ili kubadilisha mpango, usitishe kwenye Dhibiti malipo, kisha uchague mpango mwingine."],
  ["toolkit.api.checkoutFailed", "Could not start checkout. Please try again.", "Impossible de lancer le paiement. Veuillez réessayer.", "Imeshindwa kuanza malipo. Tafadhali jaribu tena."],
  ["toolkit.api.invalid", "Invalid request", "Requête invalide", "Ombi si sahihi"],
  ["toolkit.api.invalidField", "Invalid {field}", "{field} : valeur invalide", "{field}: thamani si sahihi"],
  ["toolkit.api.fieldTooLong", "{field} is too long (max {n} characters)", "{field} : texte trop long ({n} caractères maximum)", "{field}: maandishi ni marefu mno (isizidi herufi {n})"],
  ["toolkit.api.unknownIndustry", "Unknown industry", "Secteur inconnu", "Sekta haijulikani"],

  // ── Industries (profile and Compliance Guard menus) ──
  ["toolkit.industry.realtor", "Real estate", "Immobilier", "Mali isiyohamishika"],
  ["toolkit.industry.finance", "Financial services", "Services financiers", "Huduma za fedha"],
  ["toolkit.industry.nonprofit", "Nonprofit", "Association à but non lucratif", "Shirika lisilo la faida"],
  ["toolkit.industry.agency", "Marketing agency", "Agence marketing", "Wakala wa masoko"],
  ["toolkit.industry.restaurant", "Restaurant", "Restaurant", "Mgahawa"],
  ["toolkit.industry.social-work", "Social work", "Travail social", "Ustawi wa jamii"],
  ["toolkit.industry.medical", "Medical practice", "Cabinet médical", "Kliniki ya matibabu"],
  ["toolkit.industry.legal", "Law firm", "Cabinet d'avocats", "Kampuni ya uwakili"],
  ["toolkit.industry.insurance", "Insurance agency", "Agence d'assurance", "Wakala wa bima"],
  ["toolkit.industry.home-services", "Home services and trades", "Services à domicile et artisans", "Huduma za nyumbani na mafundi"],
  ["toolkit.industry.ecommerce", "E-commerce and retail", "E-commerce et commerce de détail", "Biashara mtandaoni na rejareja"],
  ["toolkit.industry.hr", "HR and recruiting", "RH et recrutement", "Rasilimali watu (HR) na uajiri"],
  ["toolkit.industry.general", "General business", "Entreprise (général)", "Biashara kwa ujumla"],

  // ── Industries (prompt library menu) ──
  ["toolkit.library.realtor", "Real estate", "Immobilier", "Mali isiyohamishika"],
  ["toolkit.library.finance", "Finance professionals", "Professionnels de la finance", "Wataalamu wa fedha"],
  ["toolkit.library.nonprofit", "Nonprofits", "Associations à but non lucratif", "Mashirika yasiyo ya faida"],
  ["toolkit.library.agency", "Marketing agencies", "Agences marketing", "Mawakala wa masoko"],
  ["toolkit.library.restaurant", "Restaurants", "Restaurants", "Migahawa"],
  ["toolkit.library.social-work", "Social work", "Travail social", "Ustawi wa jamii"],
  ["toolkit.library.medical", "Medical practice", "Cabinet médical", "Kliniki ya matibabu"],
  ["toolkit.library.legal", "Law firm", "Cabinet d'avocats", "Kampuni ya uwakili"],
  ["toolkit.library.insurance", "Insurance agency", "Agence d'assurance", "Wakala wa bima"],
  ["toolkit.library.home-services", "Home services and trades", "Services à domicile et artisans", "Huduma za nyumbani na mafundi"],
  ["toolkit.library.ecommerce", "E-commerce and retail", "E-commerce et commerce de détail", "Biashara mtandaoni na rejareja"],
  ["toolkit.library.hr", "HR and recruiting", "RH et recrutement", "Rasilimali watu (HR) na uajiri"],

  // ── Prompt categories (key: lib/toolkit/labels.ts categoryKey) ──
  ["toolkit.cat.client-communication", "Client Communication", "Communication avec les clients", "Mawasiliano na wateja"],
  ["toolkit.cat.listing-descriptions-and-property-marketing", "Listing Descriptions & Property Marketing", "Descriptions d'annonces et marketing immobilier", "Maelezo ya matangazo na masoko ya mali"],
  ["toolkit.cat.social-media-and-content", "Social Media & Content", "Réseaux sociaux et contenu", "Mitandao ya kijamii na maudhui"],
  ["toolkit.cat.lead-generation-and-follow-up", "Lead Generation & Follow-Up", "Prospection et relances", "Kupata wateja watarajiwa na ufuatiliaji"],
  ["toolkit.cat.objection-handling-and-negotiation", "Objection Handling & Negotiation", "Gestion des objections et négociation", "Kujibu pingamizi na majadiliano"],
  ["toolkit.cat.showings-open-houses-and-buyer-support", "Showings, Open Houses & Buyer Support", "Visites, portes ouvertes et accompagnement des acheteurs", "Maonyesho ya nyumba, siku za wazi na msaada kwa wanunuzi"],
  ["toolkit.cat.transactions-operations-and-sops", "Transactions, Operations & SOPs", "Transactions, opérations et procédures", "Miamala, uendeshaji na taratibu (SOP)"],
  ["toolkit.cat.market-research-pricing-and-business-planning", "Market Research, Pricing & Business Planning", "Études de marché, prix et plan d'affaires", "Utafiti wa soko, bei na mipango ya biashara"],
  ["toolkit.cat.difficult-situations-and-reputation", "Difficult Situations & Reputation", "Situations délicates et réputation", "Hali ngumu na sifa ya biashara"],
  ["toolkit.cat.bonus-power-prompts", "Bonus: Power Prompts", "Bonus : prompts avancés", "Ziada: prompt zenye nguvu"],
  ["toolkit.cat.client-emails-and-everyday-communication", "Client Emails & Everyday Communication", "Emails clients et communication courante", "Email kwa wateja na mawasiliano ya kila siku"],
  ["toolkit.cat.client-onboarding-and-meetings", "Client Onboarding & Meetings", "Accueil des clients et réunions", "Kupokea wateja wapya na mikutano"],
  ["toolkit.cat.marketing-and-social-media-content", "Marketing & Social Media Content", "Marketing et contenu pour les réseaux sociaux", "Masoko na maudhui ya mitandao ya kijamii"],
  ["toolkit.cat.prospecting-referrals-and-follow-ups", "Prospecting, Referrals & Follow-Ups", "Prospection, recommandations et relances", "Kutafuta wateja, rufaa na ufuatiliaji"],
  ["toolkit.cat.financial-planning-and-advisory-work", "Financial Planning & Advisory Work", "Planification financière et conseil", "Mipango ya fedha na kazi ya ushauri"],
  ["toolkit.cat.tax-season-and-accounting-workflows", "Tax Season & Accounting Workflows", "Saison fiscale et processus comptables", "Msimu wa kodi na michakato ya uhasibu"],
  ["toolkit.cat.pricing-proposals-and-client-reports", "Pricing, Proposals & Client Reports", "Tarifs, propositions et rapports clients", "Bei, mapendekezo na ripoti kwa wateja"],
  ["toolkit.cat.operations-sops-and-admin", "Operations, SOPs & Admin", "Opérations, procédures et administration", "Uendeshaji, taratibu na utawala"],
  ["toolkit.cat.difficult-clients-and-sticky-situations", "Difficult Clients & Sticky Situations", "Clients difficiles et situations délicates", "Wateja wagumu na hali tata"],
  ["toolkit.cat.donor-communication-and-stewardship", "Donor Communication & Stewardship", "Communication et fidélisation des donateurs", "Mawasiliano na kuwatunza wafadhili"],
  ["toolkit.cat.grant-writing-and-fundraising-proposals", "Grant Writing & Fundraising Proposals", "Demandes de subvention et propositions de collecte de fonds", "Maombi ya ruzuku na mapendekezo ya uchangishaji"],
  ["toolkit.cat.social-media-and-content-marketing", "Social Media & Content Marketing", "Réseaux sociaux et marketing de contenu", "Mitandao ya kijamii na masoko ya maudhui"],
  ["toolkit.cat.email-campaigns-and-newsletters", "Email Campaigns & Newsletters", "Campagnes email et newsletters", "Kampeni za email na majarida"],
  ["toolkit.cat.volunteer-recruitment-and-management", "Volunteer Recruitment & Management", "Recrutement et gestion des bénévoles", "Kuajiri na kusimamia wanaojitolea"],
  ["toolkit.cat.board-and-stakeholder-communication", "Board & Stakeholder Communication", "Communication avec le conseil d'administration et les parties prenantes", "Mawasiliano na bodi na wadau"],
  ["toolkit.cat.program-design-and-impact-reporting", "Program Design & Impact Reporting", "Conception de programmes et rapports d'impact", "Kubuni programu na kuripoti matokeo"],
  ["toolkit.cat.event-planning-and-promotion", "Event Planning & Promotion", "Organisation et promotion d'événements", "Kupanga na kutangaza matukio"],
  ["toolkit.cat.difficult-conversations-and-crisis-comms", "Difficult Conversations & Crisis Comms", "Conversations difficiles et communication de crise", "Mazungumzo magumu na mawasiliano wakati wa dharura"],
  ["toolkit.cat.client-communication-and-account-management", "Client Communication & Account Management", "Communication client et gestion de comptes", "Mawasiliano na wateja na usimamizi wa akaunti"],
  ["toolkit.cat.new-business-and-pitching", "New Business & Pitching", "Nouveaux clients et présentations commerciales", "Biashara mpya na mawasilisho kwa wateja"],
  ["toolkit.cat.ad-copy-and-creative-production", "Ad Copy & Creative Production", "Textes publicitaires et production créative", "Maandishi ya matangazo na kazi za ubunifu"],
  ["toolkit.cat.strategy-and-campaign-planning", "Strategy & Campaign Planning", "Stratégie et planification de campagnes", "Mkakati na kupanga kampeni"],
  ["toolkit.cat.research-and-competitive-analysis", "Research & Competitive Analysis", "Recherche et analyse concurrentielle", "Utafiti na uchambuzi wa washindani"],
  ["toolkit.cat.reporting-and-performance-analysis", "Reporting & Performance Analysis", "Reporting et analyse des performances", "Kuripoti na uchambuzi wa utendaji"],
  ["toolkit.cat.difficult-conversations-and-objection-handling", "Difficult Conversations & Objection Handling", "Conversations difficiles et gestion des objections", "Mazungumzo magumu na kujibu pingamizi"],
  ["toolkit.cat.agency-specific-and-specialized-tasks", "Agency-Specific & Specialized Tasks", "Tâches spécialisées et propres aux agences", "Kazi mahususi za wakala na za kitaalamu"],
  ["toolkit.cat.guest-communication-and-reservations", "Guest Communication & Reservations", "Communication avec les clients et réservations", "Mawasiliano na wageni na uhifadhi wa meza"],
  ["toolkit.cat.reviews-and-reputation-management", "Reviews & Reputation Management", "Avis et gestion de la réputation", "Maoni ya wateja na usimamizi wa sifa"],
  ["toolkit.cat.menu-development-and-food-descriptions", "Menu Development & Food Descriptions", "Création de menus et descriptions des plats", "Kuandaa menyu na maelezo ya vyakula"],
  ["toolkit.cat.advertising-copy-and-promotions", "Advertising Copy & Promotions", "Textes publicitaires et promotions", "Maandishi ya matangazo na ofa"],
  ["toolkit.cat.staff-management-training-and-sops", "Staff Management, Training & SOPs", "Gestion du personnel, formation et procédures", "Usimamizi wa wafanyakazi, mafunzo na taratibu"],
  ["toolkit.cat.operations-vendors-and-admin", "Operations, Vendors & Admin", "Opérations, fournisseurs et administration", "Uendeshaji, wasambazaji na utawala"],
  ["toolkit.cat.financial-tasks-pricing-costing-and-reporting", "Financial Tasks: Pricing, Costing & Reporting", "Tâches financières : prix, coûts et reporting", "Kazi za fedha: bei, gharama na ripoti"],
  ["toolkit.cat.difficult-situations-and-conflict", "Difficult Situations & Conflict", "Situations délicates et conflits", "Hali ngumu na migogoro"],
  ["toolkit.cat.planning-strategy-and-events", "Planning, Strategy & Events", "Planification, stratégie et événements", "Mipango, mkakati na matukio"],
  ["toolkit.cat.case-notes-and-documentation", "Case Notes & Documentation", "Notes de suivi et documentation", "Kumbukumbu za kesi na nyaraka"],
  ["toolkit.cat.assessment-and-care-planning", "Assessment & Care Planning", "Évaluation et plan d'accompagnement", "Tathmini na mpango wa huduma"],
  ["toolkit.cat.resources-referrals-and-benefits", "Resources, Referrals & Benefits", "Ressources, orientations et prestations", "Rasilimali, rufaa na mafao"],
  ["toolkit.cat.safety-crisis-and-risk", "Safety, Crisis & Risk", "Sécurité, crise et risques", "Usalama, dharura na hatari"],
  ["toolkit.cat.reports-courts-and-agencies", "Reports, Courts & Agencies", "Rapports, tribunaux et organismes", "Ripoti, mahakama na taasisi"],
  ["toolkit.cat.supervision-teams-and-self-care", "Supervision, Teams & Self-Care", "Supervision, équipes et soin de soi", "Usimamizi, timu na kujitunza"],
  ["toolkit.cat.community-outreach-and-programs", "Community Outreach & Programs", "Actions de proximité et programmes", "Kufikia jamii na programu"],
  ["toolkit.cat.patient-communication", "Patient Communication", "Communication avec les patients", "Mawasiliano na wagonjwa"],
  ["toolkit.cat.patient-education", "Patient Education", "Éducation des patients", "Elimu kwa wagonjwa"],
  ["toolkit.cat.scheduling-and-front-desk", "Scheduling & Front Desk", "Rendez-vous et accueil", "Kupanga miadi na mapokezi"],
  ["toolkit.cat.practice-marketing-and-reputation", "Practice Marketing & Reputation", "Marketing du cabinet et réputation", "Masoko ya kliniki na sifa"],
  ["toolkit.cat.referrals-and-care-coordination", "Referrals & Care Coordination", "Orientations et coordination des soins", "Rufaa na uratibu wa huduma"],
  ["toolkit.cat.clinical-documentation-support", "Clinical Documentation Support", "Aide à la documentation clinique", "Msaada wa nyaraka za kitabibu"],
  ["toolkit.cat.staff-training-and-operations", "Staff Training & Operations", "Formation du personnel et opérations", "Mafunzo ya wafanyakazi na uendeshaji"],
  ["toolkit.cat.practice-management-and-growth", "Practice Management & Growth", "Gestion et développement du cabinet", "Usimamizi na ukuaji wa kliniki"],
  ["toolkit.cat.client-intake-and-onboarding", "Client Intake & Onboarding", "Accueil et intégration des clients", "Kupokea na kusajili wateja wapya"],
  ["toolkit.cat.client-communication-and-updates", "Client Communication & Updates", "Communication et suivi des clients", "Mawasiliano na taarifa kwa wateja"],
  ["toolkit.cat.drafting-support", "Drafting Support", "Aide à la rédaction", "Msaada wa kuandaa nyaraka"],
  ["toolkit.cat.research-and-case-preparation", "Research & Case Preparation", "Recherche et préparation des dossiers", "Utafiti na maandalizi ya kesi"],
  ["toolkit.cat.marketing-and-content", "Marketing & Content", "Marketing et contenu", "Masoko na maudhui"],
  ["toolkit.cat.billing-fees-and-collections", "Billing, Fees & Collections", "Facturation, honoraires et recouvrement", "Ankara, ada na ukusanyaji wa madeni"],
  ["toolkit.cat.business-development-and-referrals", "Business Development & Referrals", "Développement commercial et recommandations", "Kukuza biashara na rufaa"],
  ["toolkit.cat.practice-operations", "Practice Operations", "Fonctionnement du cabinet", "Uendeshaji wa ofisi"],
  ["toolkit.cat.prospecting-and-lead-follow-up", "Prospecting & Lead Follow-Up", "Prospection et relance des prospects", "Kutafuta wateja na kufuatilia wateja watarajiwa"],
  ["toolkit.cat.policy-explanations-for-clients", "Policy Explanations for Clients", "Explication des contrats aux clients", "Kuwaelezea wateja sera za bima"],
  ["toolkit.cat.renewals-and-retention", "Renewals & Retention", "Renouvellements et fidélisation", "Kuhuisha sera na kuwabakiza wateja"],
  ["toolkit.cat.claims-support", "Claims Support", "Accompagnement des sinistres", "Msaada wa madai"],
  ["toolkit.cat.commercial-and-specialty-lines", "Commercial & Specialty Lines", "Assurances professionnelles et spécialisées", "Bima za kibiashara na maalum"],
  ["toolkit.cat.life-health-and-benefits", "Life, Health & Benefits", "Vie, santé et avantages sociaux", "Maisha, afya na mafao"],
  ["toolkit.cat.agency-operations-and-compliance", "Agency Operations & Compliance", "Fonctionnement de l'agence et conformité", "Uendeshaji wa wakala na uzingatiaji wa sheria"],
  ["toolkit.cat.quotes-and-estimates", "Quotes & Estimates", "Devis et estimations", "Nukuu za bei na makadirio"],
  ["toolkit.cat.customer-communication-and-scheduling", "Customer Communication & Scheduling", "Communication client et planification", "Mawasiliano na wateja na kupanga ratiba"],
  ["toolkit.cat.reviews-and-reputation", "Reviews & Reputation", "Avis et réputation", "Maoni ya wateja na sifa"],
  ["toolkit.cat.marketing-and-local-search", "Marketing & Local Search", "Marketing et référencement local", "Masoko na utafutaji wa karibu"],
  ["toolkit.cat.crew-and-job-site-management", "Crew & Job Site Management", "Gestion des équipes et des chantiers", "Usimamizi wa mafundi na eneo la kazi"],
  ["toolkit.cat.difficult-customers-and-disputes", "Difficult Customers & Disputes", "Clients difficiles et litiges", "Wateja wagumu na migogoro"],
  ["toolkit.cat.permits-compliance-and-paperwork", "Permits, Compliance & Paperwork", "Permis, conformité et formalités", "Vibali, uzingatiaji wa sheria na makaratasi"],
  ["toolkit.cat.business-operations-and-growth", "Business Operations & Growth", "Fonctionnement et croissance de l'entreprise", "Uendeshaji na ukuaji wa biashara"],
  ["toolkit.cat.product-listings-and-descriptions", "Product Listings & Descriptions", "Fiches produits et descriptions", "Orodha za bidhaa na maelezo"],
  ["toolkit.cat.email-and-sms-marketing", "Email & SMS Marketing", "Marketing par email et SMS", "Masoko kwa email na SMS"],
  ["toolkit.cat.customer-service", "Customer Service", "Service client", "Huduma kwa wateja"],
  ["toolkit.cat.ads-and-promotions", "Ads & Promotions", "Publicités et promotions", "Matangazo na ofa"],
  ["toolkit.cat.reviews-and-trust", "Reviews & Trust", "Avis et confiance", "Maoni ya wateja na uaminifu"],
  ["toolkit.cat.in-store-retail-and-merchandising", "In-Store Retail & Merchandising", "Vente en magasin et merchandising", "Mauzo dukani na upangaji wa bidhaa"],
  ["toolkit.cat.operations-and-growth", "Operations & Growth", "Opérations et croissance", "Uendeshaji na ukuaji"],
  ["toolkit.cat.job-ads-and-hiring", "Job Ads & Hiring", "Offres d'emploi et recrutement", "Matangazo ya kazi na kuajiri"],
  ["toolkit.cat.interviews-and-candidate-communication", "Interviews & Candidate Communication", "Entretiens et communication avec les candidats", "Mahojiano na mawasiliano na waombaji"],
  ["toolkit.cat.onboarding", "Onboarding", "Intégration", "Kuwapokea wafanyakazi wapya"],
  ["toolkit.cat.policies-and-handbooks", "Policies & Handbooks", "Politiques et règlements internes", "Sera na miongozo ya wafanyakazi"],
  ["toolkit.cat.performance-and-feedback", "Performance & Feedback", "Performance et retours", "Utendaji na mrejesho"],
  ["toolkit.cat.employee-communication-and-engagement", "Employee Communication & Engagement", "Communication interne et engagement des salariés", "Mawasiliano na ushiriki wa wafanyakazi"],
  ["toolkit.cat.difficult-conversations-and-offboarding", "Difficult Conversations & Offboarding", "Conversations difficiles et départs", "Mazungumzo magumu na kuondoka kwa wafanyakazi"],
  ["toolkit.cat.hr-operations-compliance-and-analytics", "HR Operations, Compliance & Analytics", "Opérations RH, conformité et analyses", "Uendeshaji wa HR, uzingatiaji wa sheria na uchambuzi"],
];

// ── Compliance Guard rules: [why, basis, fix] per language ──
// English comes from lib/toolkit/guard/rules.ts itself. Quoted example
// wording in the "fix" stays in English: the instant rules read English
// text, so the suggested rewrite is English too.
const RULE_TEXT: Record<string, { fr: [string, string, string]; sw: [string, string, string] }> = {
  "fh-familial-status": {
    fr: ["Décrit qui devrait habiter ici selon la situation familiale, un critère protégé par le Fair Housing Act.", "Fair Housing Act §3604(c) (situation familiale) ; directives de HUD sur la publicité", "Décrivez le bien, pas l'acheteur : « quiet cul-de-sac », « low-maintenance layout », « one-level living »."],
    sw: ["Inaeleza nani anapaswa kuishi hapa kwa kuzingatia hali ya familia, jambo linalolindwa na Fair Housing Act.", "Fair Housing Act §3604(c) (hali ya familia); mwongozo wa HUD kuhusu matangazo", "Eleza nyumba, si mnunuzi: \"quiet cul-de-sac\", \"low-maintenance layout\", \"one-level living\"."],
  },
  "fh-family-preference": {
    fr: ["Suggère une préférence pour les foyers avec enfants, ce qui peut être perçu comme une orientation discriminatoire fondée sur la situation familiale.", "Fair Housing Act §3604(c) ; directives de HUD sur la publicité", "Citez plutôt les caractéristiques : « fenced yard », « four bedrooms », « near parks and the library »."],
    sw: ["Inaashiria upendeleo kwa kaya zenye watoto, jambo linaloweza kuonekana kama kuwaelekeza wanunuzi kwa msingi wa hali ya familia.", "Fair Housing Act §3604(c); mwongozo wa HUD kuhusu matangazo", "Taja sifa za nyumba badala yake: \"fenced yard\", \"four bedrooms\", \"near parks and the library\"."],
  },
  "fh-religion-race-origin": {
    fr: ["Fait référence à la race, à la religion ou à l'origine nationale des habitants ou des acheteurs, qui sont tous des critères protégés.", "Fair Housing Act §3604(c) (race, couleur, religion, origine nationale)", "Supprimez toute mention de qui habite à proximité. Décrivez les équipements, les temps de trajet et le bien lui-même."],
    sw: ["Inataja asili ya rangi, dini au asili ya kitaifa ya wakazi au wanunuzi, makundi ambayo yote yanalindwa kisheria.", "Fair Housing Act §3604(c) (asili ya rangi, rangi ya ngozi, dini, asili ya kitaifa)", "Ondoa marejeo ya watu wanaoishi karibu. Eleza huduma zilizopo, muda wa safari na nyumba yenyewe."],
  },
  "fh-disability": {
    fr: ["Exclut ou décourage les personnes handicapées, un groupe protégé ; les animaux d'assistance ne sont pas des animaux de compagnie.", "Fair Housing Act §3604(c) (handicap) ; directives de HUD sur les animaux d'assistance", "Indiquez les faits d'accessibilité de façon neutre : « second-floor unit, no elevator », « three steps to entry »."],
    sw: ["Inawatenga au kuwakatisha tamaa watu wenye ulemavu, kundi linalolindwa; wanyama wa huduma si wanyama vipenzi.", "Fair Housing Act §3604(c) (ulemavu); mwongozo wa HUD kuhusu wanyama wa msaada", "Eleza ukweli kuhusu ufikiaji bila upendeleo: \"second-floor unit, no elevator\", \"three steps to entry\"."],
  },
  "fh-sex": {
    fr: ["Signale une préférence fondée sur le sexe, un critère protégé. (« Man cave » est généralement anodin mais souvent signalé ; renommez la pièce.)", "Fair Housing Act §3604(c) (sexe)", "Décrivez les pièces : « studio apartment », « bonus room », « finished basement den »."],
    sw: ["Inaonyesha upendeleo kwa msingi wa jinsia, kundi linalolindwa. (\"Man cave\" kwa kawaida halina madhara lakini mara nyingi huwekewa alama; badilisha jina lake.)", "Fair Housing Act §3604(c) (jinsia)", "Tumia maelezo ya vyumba: \"studio apartment\", \"bonus room\", \"finished basement den\"."],
  },
  "fh-exclusive": {
    fr: ["« Exclusive » et « restricted » ont longtemps servi de mots codés pour l'exclusion raciale et sont cités dans les directives de HUD.", "Directives de HUD sur la publicité (1995) ; formation de la NAR sur le logement équitable", "Dites ce qui existe réellement : « gated entry », « HOA-maintained grounds », « limited number of homes »."],
    sw: ["\"Exclusive\" na \"restricted\" kihistoria yametumika kama maneno ya siri ya ubaguzi wa rangi, na yametajwa katika mwongozo wa HUD.", "Mwongozo wa HUD kuhusu matangazo (1995); mafunzo ya NAR kuhusu makazi ya haki", "Sema kilichopo kwa kweli: \"gated entry\", \"HOA-maintained grounds\", \"limited number of homes\"."],
  },
  "fh-steering-safety-schools": {
    fr: ["Les affirmations subjectives sur la sécurité ou la qualité des écoles peuvent orienter les acheteurs et déclenchent souvent des plaintes.", "Commentaires de l'article 10 du Code of Ethics de la NAR ; affaires de HUD sur l'orientation des acheteurs (steering)", "Renvoyez à des sources au lieu de juger : « assigned to Lincoln Elementary (verify with the district) », « see local crime maps at … »."],
    sw: ["Madai binafsi kuhusu usalama au ubora wa shule yanaweza kuwaelekeza wanunuzi na mara nyingi huzua malalamiko.", "Mwongozo wa Kifungu 10 cha NAR Code of Ethics; kesi za HUD kuhusu kuwaelekeza wanunuzi (steering)", "Elekeza kwenye vyanzo badala ya kutoa hukumu: \"assigned to Lincoln Elementary (verify with the district)\", \"see local crime maps at …\"."],
  },
  "fh-income-source": {
    fr: ["Refuser les aides au logement (vouchers) ou l'aide publique constitue une discrimination illégale fondée sur la source de revenus dans de nombreux États et villes.", "Lois des États et lois locales sur la source de revenus (p. ex. CA, NY, NJ, WA et de nombreuses villes)", "Indiquez les critères financiers réels qui s'appliquent à tous, p. ex. « income of 2.5× rent from any lawful source »."],
    sw: ["Kukataa vocha za makazi au msaada wa serikali ni ubaguzi haramu kwa msingi wa chanzo cha mapato katika majimbo na miji mingi.", "Sheria za majimbo na za mitaa kuhusu chanzo cha mapato (k.m. CA, NY, NJ, WA, na miji mingi)", "Taja vigezo halisi vya kifedha vinavyomhusu kila mtu, k.m. \"income of 2.5× rent from any lawful source\"."],
  },
  "fh-senior": {
    fr: ["Une publicité réservée à une tranche d'âge n'est légale que pour les logements admissibles au titre du Housing for Older Persons Act.", "Fair Housing Act §3607(b) (exemption HOPA)", "Conservez-le si la résidence est admissible HOPA et précisez-le ; sinon, décrivez plutôt des caractéristiques comme « single-level »."],
    sw: ["Matangazo yanayowekea umri mipaka ni halali tu kwa makazi yanayokidhi masharti ya Housing for Older Persons Act.", "Fair Housing Act §3607(b) (msamaha wa HOPA)", "Libakize ikiwa jumuiya imethibitishwa chini ya HOPA na useme hivyo; vinginevyo eleza sifa kama \"single-level\"."],
  },
  "fin-guarantee": {
    fr: ["Les garanties ou les mentions « sans risque » concernant des placements sont considérées comme trompeuses.", "SEC Marketing Rule 206(4)-1(a) ; FINRA Rule 2210(d)(1)", "Décrivez l'approche et les risques : « aims to… », « all investing involves risk, including loss of principal »."],
    sw: ["Ahadi za uhakika au kauli za \"hakuna hatari\" kuhusu uwekezaji huchukuliwa kuwa za kupotosha.", "SEC Marketing Rule 206(4)-1(a); FINRA Rule 2210(d)(1)", "Eleza mbinu na hatari: \"aims to…\", \"all investing involves risk, including loss of principal\"."],
  },
  "fin-promissory": {
    fr: ["Prédit ou promet des résultats de placement.", "FINRA Rule 2210(d)(1)(F) (ni prédictions ni projections) ; SEC Marketing Rule", "Remplacez les résultats par la méthode : « we build a plan around your goals and review it quarterly »."],
    sw: ["Inatabiri au kuahidi matokeo ya uwekezaji.", "FINRA Rule 2210(d)(1)(F) (hakuna utabiri wala makadirio); SEC Marketing Rule", "Badilisha matokeo kwa mchakato: \"we build a plan around your goals and review it quarterly\"."],
  },
  "fin-performance": {
    fr: ["Les chiffres de performance précis exigent le contexte obligatoire : périodes, résultats nets de frais et mentions légales.", "SEC Marketing Rule 206(4)-1(d) (présentation des performances)", "Supprimez le chiffre, ou faites ajouter par le service conformité les rendements nets de frais, les périodes et les mentions avant utilisation."],
    sw: ["Takwimu mahususi za utendaji zinahitaji muktadha unaotakiwa: vipindi vya muda, matokeo baada ya ada na ufichuzi.", "SEC Marketing Rule 206(4)-1(d) (uwasilishaji wa utendaji)", "Ondoa takwimu hiyo, au mwombe afisa wa uzingatiaji aongeze mapato baada ya ada, vipindi na ufichuzi kabla ya kuitumia."],
  },
  "fin-superlative": {
    fr: ["Les superlatifs non étayés et les classements de tiers doivent indiquer la source, la date et les critères du classement.", "SEC Marketing Rule (classements de tiers) ; FINRA 2210(d)(1)(B)", "Utilisez des faits vérifiables : « CFP® professional since 2012 », ou citez le classement avec sa source et sa date."],
    sw: ["Sifa za kupindukia zisizo na ushahidi na viwango vya wahusika wengine vinahitaji chanzo, tarehe na vigezo vya kiwango hicho.", "SEC Marketing Rule (viwango vya wahusika wengine); FINRA 2210(d)(1)(B)", "Tumia ukweli unaothibitishika: \"CFP® professional since 2012\", au taja kiwango pamoja na chanzo na tarehe yake."],
  },
  "fin-testimonial": {
    fr: ["Les témoignages dans la communication d'un conseiller exigent des mentions (statut de client, rémunération, conflits d'intérêts).", "SEC Marketing Rule 206(4)-1(b) ; FINRA Rule 2210(d)(6)", "Ajoutez les mentions obligatoires à côté de tout témoignage, ou vérifiez d'abord auprès de votre responsable conformité."],
    sw: ["Shuhuda katika matangazo ya mshauri zinahitaji ufichuzi (hali ya mteja, malipo, migongano ya maslahi).", "SEC Marketing Rule 206(4)-1(b); FINRA Rule 2210(d)(6)", "Weka ufichuzi unaotakiwa kando ya kila ushuhuda, au wasiliana kwanza na afisa wako wa uzingatiaji."],
  },
  "fin-tax-claims": {
    fr: ["Laisse entendre un aval de l'IRS ou garantit un résultat fiscal ; les professionnels de la fiscalité ne peuvent faire ni l'un ni l'autre dans leur publicité.", "Treasury Circular 230 §10.30 ; directives de l'IRS sur la publicité des professionnels", "Décrivez le service : « we review every credit and deduction you qualify for »."],
    sw: ["Inaashiria kuidhinishwa na IRS au inahakikisha matokeo ya kodi; wataalamu wa kodi hawaruhusiwi kutangaza lolote kati ya hayo.", "Treasury Circular 230 §10.30; mwongozo wa IRS kuhusu matangazo ya wataalamu", "Eleza huduma: \"we review every credit and deduction you qualify for\"."],
  },
  "fin-fiduciary": {
    fr: ["Exact seulement si c'est vrai pour chaque service et chaque compte ; les régulateurs vérifient ces affirmations au regard de votre mode de rémunération.", "Actions de la SEC et des régulateurs des valeurs mobilières des États contre les déclarations de statut trompeuses", "Ne le conservez que si cela s'applique à tous vos services, et ajoutez un lien vers votre Form ADV ou vos mentions."],
    sw: ["Ni sahihi tu ikiwa ni kweli kwa kila huduma na kila akaunti; wadhibiti hupima madai haya kulingana na jinsi unavyolipwa.", "Hatua za SEC na wadhibiti wa dhamana wa majimbo dhidi ya madai ya hadhi yanayopotosha", "Libakize tu ikiwa linahusu huduma zako zote, na weka kiungo cha Form ADV au ufichuzi wako."],
  },
  "np-full-deductible": {
    fr: ["Quand les donateurs reçoivent des biens ou des services (un dîner de gala, un lot de tombola), seul le montant au-delà de la juste valeur marchande est déductible.", "IRC §6115 (déclaration de contrepartie au-delà de 75 $) ; IRS Publication 1771", "Écrivez plutôt : « Your gift is tax-deductible to the extent allowed by law. The fair market value of the dinner is $X. »"],
    sw: ["Wafadhili wanapopokea bidhaa au huduma (chakula cha jioni cha gala, zawadi ya bahati nasibu), ni kiasi kinachozidi thamani halisi ya soko pekee kinachokatwa kwenye kodi.", "IRC §6115 (ufichuzi wa quid pro quo zaidi ya $75); IRS Publication 1771", "Andika badala yake: \"Your gift is tax-deductible to the extent allowed by law. The fair market value of the dinner is $X.\""],
  },
  "np-all-goes-to": {
    fr: ["Exact seulement si les frais sont couverts par un bailleur distinct ; sinon, cela déforme l'usage réel des dons.", "Lois des États sur l'appel à la générosité publique (sollicitation trompeuse) ; normes BBB Wise Giving", "Dites ce qui est vrai : « Our board covers operating costs, so gifts to this fund go to … » ou citez votre ratio de dépenses de programmes."],
    sw: ["Ni sahihi tu ikiwa gharama zinalipwa na mfadhili mwingine; vinginevyo inapotosha jinsi michango inavyotumika.", "Sheria za majimbo kuhusu uombaji wa michango ya hisani (uombaji wa udanganyifu); viwango vya BBB Wise Giving", "Sema ukweli: \"Our board covers operating costs, so gifts to this fund go to …\" au taja uwiano wa matumizi ya programu zako."],
  },
  "np-match": {
    fr: ["Une promesse d'abondement doit correspondre à un abondement réel et engagé, avec son plafond et sa date limite.", "Lois des États sur l'appel à la générosité publique ; FTC Act §5 (allégations trompeuses)", "Nommez le partenaire, le plafond et la date limite : « The Smith Foundation will match gifts up to $10,000 through June 30. »"],
    sw: ["Dai la mchango wa kulinganisha (match) lazima liwe la kweli na lililoahidiwa, pamoja na kikomo na tarehe yake ya mwisho.", "Sheria za majimbo kuhusu uombaji wa michango ya hisani; FTC Act §5 (madai ya udanganyifu)", "Taja mfadhili anayelinganisha, kikomo na tarehe ya mwisho: \"The Smith Foundation will match gifts up to $10,000 through June 30.\""],
  },
  "np-restricted": {
    fr: ["Les dons affectés doivent être utilisés comme le donateur l'a précisé ; les réaffecter exige son accord ou une procédure légale.", "Lois des États sur les dons affectés (UPMIFA) ; contrôle par l'attorney general de l'État", "Demandez au donateur une autorisation écrite de réaffectation, ou laissez le don dans le fonds prévu."],
    sw: ["Michango yenye masharti lazima itumike kama mfadhili alivyoelekeza; kuibadilishia matumizi kunahitaji idhini ya mfadhili au mchakato wa kisheria.", "Sheria za majimbo kuhusu michango yenye masharti (UPMIFA); usimamizi wa mwanasheria mkuu wa jimbo", "Omba ruhusa ya maandishi kutoka kwa mfadhili ili kubadilisha matumizi, au acha mchango katika mfuko uliokusudiwa."],
  },
  "np-client-privacy": {
    fr: ["Les histoires des personnes que vous accompagnez exigent leur consentement et ne doivent pas révéler de détails sensibles.", "Donor Bill of Rights et normes de récit éthique ; HIPAA lorsque des informations de santé sont en jeu", "Obtenez un consentement écrit, changez les noms et omettez les diagnostics, le statut migratoire et les détails du dossier."],
    sw: ["Hadithi kuhusu watu mnaowahudumia zinahitaji idhini yao na hazipaswi kufichua taarifa nyeti.", "Donor Bill of Rights na viwango vya usimulizi wa kimaadili; HIPAA pale taarifa za afya zinapohusika", "Pata idhini ya maandishi, badilisha majina, na acha nje utambuzi wa magonjwa, hali ya uhamiaji na maelezo ya kesi."],
  },
  "ag-fake-reviews": {
    fr: ["Rédiger des avis ou des témoignages qui ne viennent pas de vrais clients est interdit, avec des sanctions civiles pour chaque infraction.", "Règle de la FTC sur les avis et témoignages de consommateurs (16 CFR Part 465, 2024)", "Demandez des avis à de vrais clients et utilisez leurs mots tels quels."],
    sw: ["Kuandika maoni au shuhuda zisizotoka kwa wateja halisi ni marufuku, na kuna adhabu za kiraia kwa kila ukiukaji.", "Kanuni ya FTC kuhusu maoni na shuhuda za wateja (16 CFR Part 465, 2024)", "Waombe wateja halisi watoe maoni, na tumia maneno yao kama walivyoandika."],
  },
  "ag-endorsement-disclosure": {
    fr: ["Les recommandations rémunérées ou obtenues contre un cadeau exigent une mention claire et visible de cette relation.", "FTC Endorsement Guides, 16 CFR 255.5", "Ajoutez « #ad », « Sponsored » ou « I received this for free » au début de la publication, pas noyé dans les hashtags."],
    sw: ["Uidhinishaji uliolipiwa au uliotolewa kwa zawadi unahitaji ufichuzi wazi na unaoonekana wa uhusiano huo.", "FTC Endorsement Guides, 16 CFR 255.5", "Ongeza \"#ad\", \"Sponsored\" au \"I received this for free\" mwanzoni mwa chapisho, si kufichwa kati ya hashtag."],
  },
  "ag-unsubstantiated": {
    fr: ["Les allégations objectives (prouvé, n° 1, meilleur, garanti) exigent des preuves en main avant d'être diffusées.", "FTC Act §5 ; FTC Policy Statement on Advertising Substantiation", "Utilisez ce que vous pouvez prouver : « rated 4.8 on Google (212 reviews, May 2026) », ou présentez-le clairement comme une opinion."],
    sw: ["Madai ya kiukweli (imethibitishwa, #1, bora zaidi, uhakika) yanahitaji ushahidi mkononi kabla ya kuchapishwa.", "FTC Act §5; FTC Policy Statement on Advertising Substantiation", "Tumia unachoweza kuthibitisha: \"rated 4.8 on Google (212 reviews, May 2026)\", au kifanye kiwe maoni waziwazi."],
  },
  "ag-results-typical": {
    fr: ["Mettre en avant des résultats exceptionnels laisse croire qu'ils sont courants ; la FTC attend que les résultats habituels soient indiqués.", "FTC Endorsement Guides, 16 CFR 255.2(b)", "Indiquez ce qui est habituel, ou ajoutez « Results vary. [Client] saw X over Y months. »"],
    sw: ["Kuonyesha matokeo ya kipekee kunaashiria kuwa ni ya kawaida; FTC inatarajia matokeo ya kawaida yafichuliwe.", "FTC Endorsement Guides, 16 CFR 255.2(b)", "Sema kilicho cha kawaida, au ongeza \"Results vary. [Client] saw X over Y months.\""],
  },
  "ag-free": {
    fr: ["Un « gratuit » soumis à conditions doit indiquer ces conditions clairement, à côté de l'offre.", "FTC Guide Concerning Use of the Word \"Free\" (16 CFR 251)", "Indiquez les conditions au même endroit et dans la même taille de caractères que le mot « free »."],
    sw: ["Neno \"bure\" lenye masharti lazima lieleze masharti hayo waziwazi kando ya ofa.", "FTC Guide Concerning Use of the Word \"Free\" (16 CFR 251)", "Eleza masharti mahali pale pale na kwa ukubwa ule ule wa herufi kama neno \"free\"."],
  },
  "ag-scarcity": {
    fr: ["La rareté et les dates limites doivent être réelles ; une urgence inventée est une pratique trompeuse.", "FTC Act §5 ; directives de la FTC sur les dark patterns (2022)", "Ne le gardez que si la limite est réelle, et indiquez la date ou le nombre exact."],
    sw: ["Uhaba na tarehe za mwisho lazima ziwe za kweli; dharura ya kubuni ni mbinu ya udanganyifu.", "FTC Act §5; mwongozo wa FTC kuhusu dark patterns (2022)", "Libakize tu ikiwa kikomo ni cha kweli, na taja tarehe au idadi halisi."],
  },
  "ag-email-footer": {
    fr: ["Un email commercial doit contenir un lien de désabonnement fonctionnel et une adresse postale physique.", "CAN-SPAM Act, 15 U.S.C. 7704", "Vérifiez que l'envoi contient un lien de désabonnement et l'adresse postale de votre entreprise."],
    sw: ["Email ya kibiashara inahitaji kiungo cha kujiondoa kinachofanya kazi na anwani halisi ya posta.", "CAN-SPAM Act, 15 U.S.C. 7704", "Hakikisha ujumbe unaotumwa una kiungo cha kujiondoa na anwani ya posta ya biashara yako."],
  },
  "rs-allergen-free": {
    fr: ["Affirmer l'absence d'allergènes est une promesse de sécurité ; une cuisine partagée peut rarement la tenir.", "FDA Food Allergen Labeling (FALCPA) ; codes alimentaires des États et locaux", "Écrivez plutôt : « Made without nuts. Our kitchen handles nuts, so we can't guarantee against cross-contact. »"],
    sw: ["Dai kwamba chakula hakina vizio (allergens) ni ahadi ya usalama; jiko linalotumika kwa vyakula vingi mara chache linaweza kuitimiza.", "FDA Food Allergen Labeling (FALCPA); kanuni za chakula za majimbo na za mitaa", "Andika badala yake: \"Made without nuts. Our kitchen handles nuts, so we can't guarantee against cross-contact.\""],
  },
  "rs-gluten-free": {
    fr: ["Selon la règle de la FDA, « gluten-free » signifie moins de 20 ppm de gluten ; les restaurants qui emploient ce terme doivent respecter ce seuil.", "Règle de la FDA sur le sans gluten, 21 CFR 101.91, et directives de la FDA pour les restaurants", "Ne l'utilisez que pour les plats dont vous maîtrisez la contamination croisée ; sinon, écrivez « made without gluten-containing ingredients »."],
    sw: ["Kwa kanuni ya FDA, \"gluten-free\" maana yake ni gluteni chini ya 20 ppm; migahawa inatarajiwa kutimiza hilo inapotumia neno hilo.", "Kanuni ya FDA kuhusu gluten-free, 21 CFR 101.91, na mwongozo wa FDA kwa migahawa", "Litumie tu kwa vyakula ambavyo unadhibiti mchanganyiko wa bahati mbaya (cross-contact); vinginevyo sema \"made without gluten-containing ingredients\"."],
  },
  "rs-health-claims": {
    fr: ["Les allégations de santé, de teneur en nutriments et « organic » (bio) ont une définition précise et doivent être exactes.", "Règles de la FDA sur les allégations nutritionnelles et de santé ; USDA National Organic Program", "Décrivez plutôt les ingrédients et la préparation, et réservez « organic » aux ingrédients certifiés bio."],
    sw: ["Madai ya afya, ya kiwango cha virutubisho na ya \"organic\" yana maana zilizobainishwa na lazima yawe sahihi.", "Kanuni za FDA kuhusu madai ya virutubisho na afya; USDA National Organic Program", "Eleza viungo na namna ya kupika badala yake, na tumia \"organic\" kwa viungo vilivyothibitishwa kuwa organic pekee."],
  },
  "rs-alcohol": {
    fr: ["De nombreux États limitent les promotions à boissons illimitées ou à alcool gratuit.", "Lois des États sur le contrôle des boissons alcoolisées (p. ex. MA, UT et NC encadrent les happy hours et les boissons à volonté)", "Vérifiez les règles de votre État avant toute promotion ; les offres au prix par verre sont plus sûres."],
    sw: ["Majimbo mengi yanaweka vikwazo kwa ofa za vinywaji visivyo na kikomo na pombe ya bure.", "Sheria za majimbo za udhibiti wa vileo (k.m. MA, UT, NC zinadhibiti happy hour na vinywaji visivyo na kikomo)", "Kagua kanuni za jimbo lako kabla ya kutangaza; ofa za bei kwa kila kinywaji ni salama zaidi."],
  },
  "rs-review-privacy": {
    fr: ["Une réponse publique qui révèle les détails de la visite d'un client peut porter atteinte à sa vie privée et aggraver la plainte.", "Règles des plateformes d'avis (Google, Yelp) ; attentes générales en matière de vie privée", "Gardez les réponses publiques générales et passez aux détails par message privé ou par téléphone."],
    sw: ["Majibu ya hadharani yanayofichua maelezo ya ziara ya mteja yanaweza kukiuka faragha yake na kuzidisha malalamiko.", "Sera za maoni za majukwaa (Google, Yelp); matarajio ya jumla ya faragha", "Weka majibu ya hadharani kwa ujumla na peleka maelezo mahususi kwenye ujumbe wa faragha au simu."],
  },
  "md-guarantee": {
    fr: ["Les promesses sur les résultats ou la sécurité d'un traitement sont considérées comme trompeuses, et les résultats varient selon les patients.", "FTC Act §5 (allégations de santé) ; règles publicitaires des ordres médicaux des États ; AMA Code of Medical Ethics sur la publicité", "Décrivez en quoi consiste le traitement et à qui il peut profiter : « many patients find… », « results vary; we'll discuss what to expect. »"],
    sw: ["Ahadi kuhusu matokeo au usalama wa matibabu huchukuliwa kuwa za kupotosha, na matokeo hutofautiana kwa kila mgonjwa.", "FTC Act §5 (madai ya afya); kanuni za matangazo za bodi za matibabu za majimbo; AMA Code of Medical Ethics kuhusu matangazo", "Eleza matibabu yanahusisha nini na yanaweza kumsaidia nani: \"many patients find…\", \"results vary; we'll discuss what to expect.\""],
  },
  "md-phi": {
    fr: ["Ressemble à un identifiant (date de naissance, numéro de dossier ou de sécurité sociale). Les informations de santé ou sur un client permettant une identification ne doivent pas figurer dans la communication, les réseaux sociaux ou les brouillons partagés.", "HIPAA Privacy Rule (45 CFR 164.514, anonymisation) ; NASW Code of Ethics 1.07 (confidentialité)", "Supprimez les identifiants. Parlez d'« un patient » ou d'« un client », et utilisez un système sécurisé et approuvé pour toute donnée identifiante."],
    sw: ["Inaonekana kama kitambulisho (tarehe ya kuzaliwa, namba ya rekodi au ya hifadhi ya jamii). Taarifa za afya au za mteja zinazoweza kumtambulisha hazipaswi kuwekwa kwenye matangazo, mitandao ya kijamii au rasimu zinazoshirikiwa.", "HIPAA Privacy Rule (45 CFR 164.514, kuondoa utambulisho); NASW Code of Ethics 1.07 (usiri)", "Ondoa vitambulisho. Tumia \"mgonjwa\" au \"mteja\", na tumia mfumo salama ulioidhinishwa kwa chochote kinachoweza kumtambulisha mtu."],
  },
  "md-testimonial": {
    fr: ["Les témoignages de patients et les photos avant-après exigent une autorisation écrite et ne doivent pas suggérer des résultats habituels.", "Autorisation marketing HIPAA (45 CFR 164.508(a)(3)) ; FTC Endorsement Guides (résultats habituels)", "À utiliser uniquement avec l'autorisation écrite du patient, en ajoutant « Individual results vary. »"],
    sw: ["Hadithi za wagonjwa na picha za kabla na baada zinahitaji idhini ya maandishi na hazipaswi kuashiria kuwa matokeo hayo ni ya kawaida.", "Idhini ya matangazo ya HIPAA (45 CFR 164.508(a)(3)); FTC Endorsement Guides (matokeo ya kawaida)", "Tumia tu kwa idhini ya maandishi ya mgonjwa, na ongeza \"Individual results vary.\""],
  },
  "md-superlative": {
    fr: ["Les comparaisons entre médecins doivent être vérifiables ; de nombreux ordres médicaux d'État jugent trompeurs les superlatifs invérifiables.", "Règles publicitaires des ordres médicaux des États ; FTC Act §5", "Utilisez des faits : années d'exercice, certification (board certification), nombre d'interventions réalisées (si vous le suivez)."],
    sw: ["Madai ya kulinganisha madaktari lazima yathibitishike; bodi nyingi za majimbo huona sifa za kupindukia zisizothibitishika kuwa za kupotosha.", "Kanuni za matangazo za bodi za matibabu za majimbo; FTC Act §5", "Tumia ukweli: miaka ya kutoa huduma, cheti cha bodi, idadi ya taratibu zilizofanywa (ikiwa unaifuatilia)."],
  },
  "sw-identifiers": {
    fr: ["Des détails qui identifient un client dans des brouillons, des rapports diffusés au-delà du nécessaire ou des actions de sensibilisation rompent la confidentialité.", "NASW Code of Ethics 1.07 (vie privée et confidentialité) ; HIPAA et 42 CFR Part 2 le cas échéant", "Utilisez des initiales ou « le client » dans les brouillons, et conservez les identifiants dans le système de dossiers sécurisé de votre organisme."],
    sw: ["Maelezo yanayomtambulisha mteja katika rasimu, ripoti zinazoshirikiwa zaidi ya inavyohitajika, au kampeni za kufikia jamii yanavunja usiri.", "NASW Code of Ethics 1.07 (faragha na usiri); HIPAA na 42 CFR Part 2 pale inapohusika", "Tumia herufi za mwanzo au \"mteja\" katika rasimu, na hifadhi vitambulisho katika mfumo salama wa kumbukumbu wa taasisi yako."],
  },
  "sw-judgemental": {
    fr: ["Un langage qui étiquette ou stigmatise peut influencer les lecteurs d'un dossier ou d'un rapport et porter atteinte à la dignité du client.", "NASW Code of Ethics 1.01 et 1.12 (dignité ; langage dénigrant) ; pratique de rédaction centrée sur la personne", "Décrivez les comportements et le contexte de façon factuelle : « did not attend three scheduled visits », « person with a substance use disorder »."],
    sw: ["Lugha ya kubandika majina au ya unyanyapaa inaweza kuwaathiri wasomaji wa rekodi au ripoti na kudhalilisha utu wa mteja.", "NASW Code of Ethics 1.01 na 1.12 (utu; lugha ya kudhalilisha); desturi ya uandishi unaomtanguliza mtu", "Eleza tabia na muktadha kwa ukweli: \"did not attend three scheduled visits\", \"person with a substance use disorder\"."],
  },
  "sw-promise": {
    fr: ["Un travailleur social ne peut garantir ni un résultat ni une confidentialité absolue (obligation de signalement, décisions d'admissibilité prises par d'autres).", "NASW Code of Ethics 1.07(e) (limites de la confidentialité) et 1.03 (consentement éclairé)", "Soyez clair sur les limites : « What you tell me is private, except when someone's safety is at risk. » « I'll help you apply; the agency makes the decision. »"],
    sw: ["Mfanyakazi wa ustawi wa jamii hawezi kuhakikisha matokeo au usiri kamili (wajibu wa kuripoti kisheria, maamuzi ya kustahiki yanayofanywa na wengine).", "NASW Code of Ethics 1.07(e) (mipaka ya usiri) na 1.03 (idhini baada ya kuelewa)", "Kuwa wazi kuhusu mipaka: \"What you tell me is private, except when someone's safety is at risk.\" \"I'll help you apply; the agency makes the decision.\""],
  },
  "lg-guarantee": {
    fr: ["Les avocats ne peuvent ni promettre ni laisser entendre des résultats qu'ils ne peuvent garantir.", "ABA Model Rule 7.1 (communications fausses ou trompeuses) et commentaire [3] ; règles publicitaires des barreaux des États", "Décrivez plutôt la démarche et l'expérience, et ajoutez l'avertissement sur les résultats passés exigé par votre État."],
    sw: ["Mawakili hawaruhusiwi kuahidi au kuashiria matokeo wasiyoweza kuyahakikisha.", "ABA Model Rule 7.1 (mawasiliano ya uongo au ya kupotosha) na maoni [3]; kanuni za matangazo za vyama vya mawakili vya majimbo", "Eleza mchakato na uzoefu badala yake, na weka tahadhari ya jimbo lako kuhusu matokeo ya zamani pale inapotakiwa."],
  },
  "lg-specialist": {
    fr: ["Dans de nombreux États, « specialist » et les termes voisins sont réservés aux avocats certifiés par un organisme agréé, et les superlatifs doivent être vérifiables.", "ABA Model Rule 7.2(c) (spécialiste certifié) et Rule 7.1 ; règles des barreaux des États", "Écrivez « focuses on » ou « practises in », et n'utilisez « certified specialist » qu'en nommant l'organisme de certification."],
    sw: ["Katika majimbo mengi, \"specialist\" na maneno kama hayo yanaruhusiwa tu kwa mawakili waliothibitishwa na chombo kilichoidhinishwa, na sifa za kupindukia lazima zithibitishike.", "ABA Model Rule 7.2(c) (mtaalamu aliyethibitishwa) na Rule 7.1; kanuni za vyama vya mawakili vya majimbo", "Sema \"focuses on\" au \"practises in\", na tumia \"certified specialist\" tu ukitaja shirika lililotoa uthibitisho."],
  },
  "lg-past-results": {
    fr: ["Les résultats passés peuvent créer des attentes injustifiées ; de nombreux États exigent un avertissement à côté.", "ABA Model Rule 7.1, commentaire [3] ; règles des barreaux des États (p. ex. « prior results do not guarantee a similar outcome »)", "Ajoutez l'avertissement exigé par votre État à côté du chiffre, ou décrivez l'affaire sans le montant."],
    sw: ["Matokeo ya zamani yanaweza kujenga matarajio yasiyo na msingi; majimbo mengi yanataka tahadhari iwekwe kando yake.", "ABA Model Rule 7.1 maoni [3]; kanuni za vyama vya mawakili vya majimbo (k.m. \"prior results do not guarantee a similar outcome\")", "Ongeza tahadhari inayotakiwa na jimbo lako kando ya kiasi hicho, au eleza kesi bila kutaja kiasi."],
  },
  "lg-solicitation": {
    fr: ["Le démarchage ciblé de personnes dont on sait qu'elles ont besoin d'aide juridique est encadré, et certains États imposent des délais d'attente ou des mentions.", "ABA Model Rule 7.3 (démarchage de clients) ; règles des États sur le courrier ciblé (p. ex. mention « Advertising Material »)", "Vérifiez les règles de démarchage de votre État avant l'envoi, et restez général plutôt que d'évoquer ce qui est arrivé à la personne."],
    sw: ["Kuwafikia moja kwa moja watu wanaojulikana kuhitaji msaada wa kisheria kumewekewa vikwazo, na baadhi ya majimbo yanataka muda wa kusubiri au maandishi maalum.", "ABA Model Rule 7.3 (kuomba wateja); kanuni za majimbo kuhusu barua zinazolenga watu (k.m. alama ya \"Advertising Material\")", "Kagua kanuni za jimbo lako kuhusu kuomba wateja kabla ya kutuma, na weka ujumbe kwa ujumla badala ya kutaja tukio la mtu huyo."],
  },
  "in-guarantee": {
    fr: ["Exagérer la couverture ou garantir un prix ou une acceptation donne une image fausse du contrat.", "Lois des États sur les pratiques commerciales déloyales (NAIC Model Unfair Trade Practices Act §4 : déclarations inexactes et publicité mensongère)", "Décrivez ce que le contrat peut couvrir et renvoyez à ses conditions : « coverage depends on your policy; exclusions apply. »"],
    sw: ["Kukuza kiwango cha bima kuliko kilivyo, au kuhakikisha bei au kukubaliwa, kunaeleza sera vibaya.", "Sheria za majimbo kuhusu biashara isiyo ya haki (NAIC Model Unfair Trade Practices Act §4: maelezo ya uongo na matangazo ya uongo)", "Eleza kile ambacho sera inaweza kulipia, na elekeza kwenye masharti ya sera: \"coverage depends on your policy; exclusions apply.\""],
  },
  "in-free": {
    fr: ["Offrir quelque chose de valeur pour inciter à l'achat peut constituer une ristourne ou une incitation illégale selon le droit des assurances de l'État.", "Lois des États contre les ristournes et les incitations (NAIC Model Act §4.H) ; règles des départements d'assurance des États", "Vérifiez les règles de votre État sur les ristournes avant d'offrir quoi que ce soit ; décrivez plutôt les avantages du contrat."],
    sw: ["Kutoa kitu chenye thamani ili kushawishi ununuzi kunaweza kuwa punguzo haramu (rebating) au kishawishi kilichokatazwa chini ya sheria ya bima ya jimbo.", "Sheria za majimbo dhidi ya rebating na vishawishi (NAIC Model Act §4.H); kanuni za idara za bima za majimbo", "Kagua kanuni za jimbo lako kuhusu rebating kabla ya kutoa chochote chenye thamani; eleza faida za sera badala yake."],
  },
  "in-savings": {
    fr: ["Les chiffres d'économies exigent une base documentée et, en général, une mention de leur mode de calcul.", "Réglementations des États sur la publicité en assurance ; FTC Act §5", "Gardez une trace du calcul et indiquez-en la base, ou écrivez « you may be able to save. »"],
    sw: ["Takwimu za akiba zinahitaji msingi ulioandikwa na kwa kawaida ufichuzi wa jinsi zilivyokokotolewa.", "Kanuni za majimbo kuhusu matangazo ya bima; FTC Act §5", "Hifadhi kumbukumbu ya jinsi takwimu ilivyokokotolewa na ongeza msingi wake, au sema \"you may be able to save.\""],
  },
  "hs-licensed": {
    fr: ["Exact seulement si chaque licence et chaque assurance sont à jour pour les travaux et la zone annoncés ; de nombreux États exigent aussi le numéro de licence dans les annonces.", "Lois des États sur les licences d'entrepreneur (p. ex. California B&P Code 7030.5, numéro de licence dans les annonces) ; FTC Act §5", "Ne le gardez que si c'est vrai aujourd'hui, et ajoutez votre numéro de licence là où votre État l'exige."],
    sw: ["Ni sahihi tu ikiwa kila leseni na kila bima ni halali kwa kazi na eneo linalotangazwa; majimbo mengi pia yanataka namba ya leseni iwe kwenye matangazo.", "Sheria za majimbo kuhusu leseni za wakandarasi (k.m. California B&P Code 7030.5, namba ya leseni kwenye matangazo); FTC Act §5", "Libakize tu ikiwa ni kweli leo, na ongeza namba yako ya leseni pale jimbo lako linapotaka."],
  },
  "hs-lowest": {
    fr: ["Les garanties de prix doivent être respectées exactement comme annoncé, avec toutes les conditions clairement indiquées.", "FTC Guides Against Deceptive Pricing (16 CFR 233) ; lois des États sur la protection des consommateurs", "Indiquez les conditions juste à côté de la promesse, ou décrivez honnêtement vos prix : « upfront, written quotes. »"],
    sw: ["Ahadi za bei lazima zitekelezwe kama zilivyotangazwa, na masharti yoyote yaelezwe waziwazi.", "FTC Guides Against Deceptive Pricing (16 CFR 233); sheria za majimbo za kulinda watumiaji", "Eleza masharti kando kabisa ya ahadi, au eleza bei zako kwa uaminifu: \"upfront, written quotes.\""],
  },
  "hs-warranty": {
    fr: ["Les promesses de garantie doivent correspondre à la garantie écrite, y compris le sens de « lifetime » et les exclusions.", "Magnuson-Moss Warranty Act ; FTC Guides for the Advertising of Warranties (16 CFR 239)", "Dites ce que couvre la garantie et pour combien de temps, et rendez les conditions écrites accessibles."],
    sw: ["Madai ya dhamana lazima yalingane na dhamana iliyoandikwa, ikiwemo maana ya \"lifetime\" na kile kisichohusika.", "Magnuson-Moss Warranty Act; FTC Guides for the Advertising of Warranties (16 CFR 239)", "Sema dhamana inahusu nini na kwa muda gani, na weka masharti yaliyoandikwa yapatikane."],
  },
  "ec-made-in-usa": {
    fr: ["Une mention « Made in USA » sans réserve exige que la totalité ou la quasi-totalité du produit soit fabriquée aux États-Unis.", "FTC Made in USA Labeling Rule (16 CFR 323)", "Ne l'utilisez que si le produit est entièrement ou quasi entièrement fabriqué aux États-Unis ; sinon, nuancez : « Assembled in the USA from imported parts. »"],
    sw: ["Dai la \"Made in USA\" bila maelezo ya ziada linahitaji bidhaa yote au karibu yote itengenezwe Marekani.", "FTC Made in USA Labeling Rule (16 CFR 323)", "Litumie tu ikiwa bidhaa yote au karibu yote imetengenezwa Marekani; vinginevyo liwekee maelezo: \"Assembled in the USA from imported parts.\""],
  },
  "ec-was-price": {
    fr: ["Un prix de référence doit être un prix réellement pratiqué, pendant une durée raisonnable et récemment.", "FTC Guides Against Deceptive Pricing (16 CFR 233.1) ; lois des États sur les prix de référence", "N'affichez qu'un ancien prix réellement pratiqué ; conservez les dates et les justificatifs."],
    sw: ["Bei ya marejeo lazima iwe bei uliyotoza kweli, kwa kipindi cha kutosha, hivi karibuni.", "FTC Guides Against Deceptive Pricing (16 CFR 233.1); sheria za majimbo kuhusu bei za marejeo", "Onyesha tu bei ya awali uliyotoza kweli; hifadhi tarehe na kumbukumbu."],
  },
  "ec-eco": {
    fr: ["Les allégations environnementales générales et les mentions « naturel » exigent des justifications précises et étayées.", "FTC Green Guides (16 CFR 260) ; FTC Act §5", "Soyez précis et vérifiable : « packaging is 80% recycled cardboard », et non « eco-friendly »."],
    sw: ["Madai mapana ya kimazingira na ya \"asili\" yanahitaji ushahidi mahususi unaothibitishika.", "FTC Green Guides (16 CFR 260); FTC Act §5", "Kuwa mahususi na mwenye ushahidi: \"packaging is 80% recycled cardboard\", si \"eco-friendly\"."],
  },
  "hr-age": {
    fr: ["Une formulation qui signale une préférence pour des personnes plus jeunes peut constituer une preuve de discrimination liée à l'âge.", "Age Discrimination in Employment Act (29 U.S.C. 623(e)) ; directives de l'EEOC sur les offres d'emploi", "Décrivez les compétences et les missions : « comfortable learning new software », « entry-level role »."],
    sw: ["Maneno yanayoonyesha upendeleo kwa wafanyakazi wenye umri mdogo yanaweza kuwa ushahidi wa ubaguzi wa umri.", "Age Discrimination in Employment Act (29 U.S.C. 623(e)); mwongozo wa EEOC kuhusu matangazo ya kazi", "Eleza ujuzi na majukumu: \"comfortable learning new software\", \"entry-level role\"."],
  },
  "hr-protected": {
    fr: ["Un langage qui suggère une préférence fondée sur le sexe, l'origine nationale, la nationalité, le handicap, la religion ou la situation familiale peut être discriminatoire.", "Title VII (42 U.S.C. 2000e-3(b)) ; ADA ; IRCA, discrimination fondée sur la nationalité (8 U.S.C. 1324b) ; directives de l'EEOC", "Utilisez des intitulés de poste neutres, indiquez le niveau de langue réellement requis (« fluent written English ») et listez des missions, pas des traits personnels."],
    sw: ["Lugha inayoashiria upendeleo kwa msingi wa jinsia, asili ya kitaifa, uraia, ulemavu, dini au hali ya familia inaweza kuwa ya kibaguzi.", "Title VII (42 U.S.C. 2000e-3(b)); ADA; IRCA kuhusu ubaguzi wa uraia (8 U.S.C. 1324b); mwongozo wa EEOC", "Tumia vyeo vya kazi visivyoegemea upande wowote, taja kiwango cha lugha kinachohitajika kweli (\"fluent written English\"), na orodhesha majukumu, si sifa za mtu."],
  },
  "hr-salary": {
    fr: ["Un nombre croissant d'États et de villes exigent une fourchette de salaire de bonne foi dans les offres d'emploi.", "Lois sur la transparence salariale (p. ex. Colorado, Californie, Washington, New York, Illinois)", "Ajoutez la fourchette de salaire du poste et les avantages là où la loi l'exige (cela attire aussi plus de candidats)."],
    sw: ["Idadi inayoongezeka ya majimbo na miji inataka kiwango cha mshahara cha nia njema kwenye matangazo ya kazi.", "Sheria za uwazi wa mishahara (k.m. Colorado, California, Washington, New York, Illinois)", "Ongeza kiwango cha mshahara wa nafasi hiyo na marupurupu pale sheria inapotaka (pia huvutia waombaji wengi zaidi)."],
  },
};

const PARTS = ["why", "basis", "fix"] as const;

const messages: Messages = { en: {}, fr: {}, sw: {} };
for (const [key, en, fr, sw] of UI) {
  messages.en[key] = en;
  messages.fr[key] = fr;
  messages.sw[key] = sw;
}
for (const rule of RULES) {
  const tr = RULE_TEXT[rule.id];
  PARTS.forEach((part, i) => {
    const key = `toolkit.rule.${rule.id}.${part}`;
    messages.en[key] = rule[part];
    if (tr) {
      messages.fr[key] = tr.fr[i];
      messages.sw[key] = tr.sw[i];
    }
  });
}

export default messages;
