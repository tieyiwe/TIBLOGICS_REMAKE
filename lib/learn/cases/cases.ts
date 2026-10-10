// Real-case library (/learn/cases and the "Real cases" section of each track
// page). Short business scenarios showing what a track teaches at work, each
// linked to a lab of the same track to practise it.
//
// These are ILLUSTRATIVE scenarios written for learning: the businesses are
// fictional (no real company names) and the results describe typical
// outcomes in words, never invented figures presented as real data. The UI
// labels every case "Illustrative case". Places mix African and US cities.
//
// `labSlug` must be a lab slug from the same track's seed (lib/learn/seed);
// the page checks it is published and links the track page otherwise.

export type L3 = { en: string; fr: string; sw: string };
export type L3List = { en: string[]; fr: string[]; sw: string[] };

export interface RealCase {
  id: string;
  trackSlug: string;
  title: L3;
  place: L3;
  sector: L3;
  situation: L3;
  steps: L3List;
  result: L3;
  /** The lessons or skills of the track it maps to. */
  skills: L3;
  labSlug: string | null;
}

export const CASES: RealCase[] = [
  // ── AI Foundations for Everyone ─────────────────────────────────────────
  {
    id: "lagos-dispatch-delay-notices",
    trackSlug: "ai-foundations",
    title: {
      en: "A logistics dispatcher writes clear delay notices",
      fr: "Une répartitrice en logistique rédige des avis de retard clairs",
      sw: "Msimamizi wa usafirishaji anaandika taarifa za kuchelewa zilizo wazi",
    },
    place: { en: "Lagos, Nigeria", fr: "Lagos, Nigeria", sw: "Lagos, Nigeria" },
    sector: { en: "Logistics", fr: "Logistique", sw: "Usafirishaji" },
    situation: {
      en: "A small delivery company moves parcels for online shops across Lagos. When traffic or a breakdown delays a van, the dispatcher has to tell dozens of customers quickly. Her first AI drafts were vague and too formal, and customers kept calling to ask when their parcel would really arrive.",
      fr: "Une petite entreprise de livraison transporte les colis de boutiques en ligne dans tout Lagos. Quand un embouteillage ou une panne retarde une camionnette, la répartitrice doit prévenir des dizaines de clients rapidement. Ses premiers brouillons faits avec l’IA étaient vagues et trop formels, et les clients appelaient pour savoir quand leur colis arriverait vraiment.",
      sw: "Kampuni ndogo ya usafirishaji inasafirisha vifurushi vya maduka ya mtandaoni kote Lagos. Gari likichelewa kwa sababu ya msongamano au hitilafu, msimamizi lazima awaarifu wateja wengi haraka. Rasimu zake za kwanza za AI zilikuwa hazieleweki na rasmi mno, na wateja waliendelea kupiga simu kuuliza kifurushi kitafika lini hasa.",
    },
    steps: {
      en: [
        "She rewrote her request with the four elements: her role, the task, the context (route, new time window, reason) and the format (an SMS under 300 characters).",
        "She added one example of a message customers liked, so the tone stayed warm and direct.",
        "She read every draft before sending and corrected any time the AI guessed.",
      ],
      fr: [
        "Elle a réécrit sa demande avec les quatre éléments : son rôle, la tâche, le contexte (itinéraire, nouveau créneau, raison) et le format (un SMS de moins de 300 caractères).",
        "Elle a ajouté un exemple de message apprécié des clients, pour garder un ton chaleureux et direct.",
        "Elle relisait chaque brouillon avant l’envoi et corrigeait toute heure que l’IA avait devinée.",
      ],
      sw: [
        "Aliandika upya ombi lake kwa vipengele vinne: nafasi yake, kazi, muktadha (njia, muda mpya, sababu) na muundo (SMS isiyozidi herufi 300).",
        "Aliongeza mfano mmoja wa ujumbe ambao wateja waliupenda, ili sauti ibaki ya kirafiki na ya moja kwa moja.",
        "Alisoma kila rasimu kabla ya kutuma na kusahihisha muda wowote ambao AI ilikisia.",
      ],
    },
    result: {
      en: "In this scenario, notices go out within minutes of a delay and say exactly what changed and what happens next. Fewer customers need to call, and the dispatcher keeps control of every promise made.",
      fr: "Dans ce scénario, les avis partent quelques minutes après un retard et disent exactement ce qui change et la suite. Moins de clients ont besoin d’appeler, et la répartitrice garde la main sur chaque promesse faite.",
      sw: "Katika mfano huu, taarifa zinatumwa dakika chache baada ya kuchelewa na zinaeleza wazi kilichobadilika na kinachofuata. Wateja wachache wanahitaji kupiga simu, na msimamizi anabaki na udhibiti wa kila ahadi.",
    },
    skills: {
      en: "Writing prompts with role, task, context and format; checking output before it reaches a customer.",
      fr: "Écrire des prompts avec rôle, tâche, contexte et format ; vérifier le résultat avant qu’il n’atteigne un client.",
      sw: "Kuandika prompt zenye nafasi, kazi, muktadha na muundo; kukagua matokeo kabla hayajamfikia mteja.",
    },
    labSlug: "ai-foundations-lab-2-four-elements",
  },
  {
    id: "baltimore-dental-redaction",
    trackSlug: "ai-foundations",
    title: {
      en: "A dental office keeps patient data out of the chatbot",
      fr: "Un cabinet dentaire garde les données des patients hors du chatbot",
      sw: "Ofisi ya meno inazuia data za wagonjwa kuingia kwenye chatbot",
    },
    place: { en: "Baltimore, USA", fr: "Baltimore, États-Unis", sw: "Baltimore, Marekani" },
    sector: { en: "Health care", fr: "Santé", sw: "Afya" },
    situation: {
      en: "The front desk of a family dental office wanted help writing friendlier reminder letters and follow-up notes. A new staff member pasted a full patient record into a free chatbot to get a draft. The office manager realised nobody had agreed what could and could not go into an AI tool.",
      fr: "L’accueil d’un cabinet dentaire familial voulait de l’aide pour rédiger des lettres de rappel et des suivis plus chaleureux. Un nouvel employé a collé le dossier complet d’un patient dans un chatbot gratuit pour obtenir un brouillon. La responsable du cabinet s’est rendu compte que personne n’avait décidé ce qui pouvait aller ou non dans un outil d’IA.",
      sw: "Mapokezi ya ofisi ya meno ya familia yalitaka msaada wa kuandika barua za ukumbusho na ujumbe wa ufuatiliaji zenye urafiki zaidi. Mfanyakazi mpya alibandika rekodi kamili ya mgonjwa kwenye chatbot ya bure ili kupata rasimu. Meneja wa ofisi aligundua kwamba hakuna aliyekubaliana nini kinaweza na kisichoweza kuingia kwenye zana ya AI.",
    },
    steps: {
      en: [
        "The team listed what counts as private: names, dates of birth, insurance numbers, treatment details.",
        "They practised replacing those details with placeholders such as [PATIENT] and [DATE] before asking for a draft.",
        "Real details are added back by hand, inside the practice software, after the wording is approved.",
      ],
      fr: [
        "L’équipe a listé ce qui est privé : noms, dates de naissance, numéros d’assurance, détails des soins.",
        "Elle s’est entraînée à remplacer ces détails par des repères comme [PATIENT] et [DATE] avant de demander un brouillon.",
        "Les vraies informations sont remises à la main, dans le logiciel du cabinet, une fois le texte validé.",
      ],
      sw: [
        "Timu iliorodhesha taarifa za siri: majina, tarehe za kuzaliwa, namba za bima, maelezo ya matibabu.",
        "Walifanya mazoezi ya kubadilisha taarifa hizo kwa alama kama [MGONJWA] na [TAREHE] kabla ya kuomba rasimu.",
        "Taarifa halisi zinarudishwa kwa mkono, ndani ya programu ya ofisi, baada ya maneno kukubaliwa.",
      ],
    },
    result: {
      en: "In this scenario, the office keeps the time saved on writing while no patient record leaves its own systems. New staff learn the rule on their first day.",
      fr: "Dans ce scénario, le cabinet garde le temps gagné sur la rédaction sans qu’aucun dossier patient ne quitte ses propres systèmes. Les nouveaux employés apprennent la règle dès leur premier jour.",
      sw: "Katika mfano huu, ofisi inaendelea kuokoa muda wa kuandika bila rekodi yoyote ya mgonjwa kutoka nje ya mifumo yake. Wafanyakazi wapya wanajifunza kanuni hii siku yao ya kwanza.",
    },
    skills: {
      en: "Protecting private data, redacting before you prompt, safe everyday use of AI tools.",
      fr: "Protéger les données privées, anonymiser avant d’écrire un prompt, utiliser l’IA au quotidien en sécurité.",
      sw: "Kulinda data binafsi, kuficha taarifa kabla ya kuandika prompt, matumizi salama ya kila siku ya zana za AI.",
    },
    labSlug: "ai-foundations-lab-5-redaction-drill",
  },
  {
    id: "kigali-tour-source-check",
    trackSlug: "ai-foundations",
    title: {
      en: "A tour operator checks AI answers before quoting them",
      fr: "Un voyagiste vérifie les réponses de l’IA avant de les citer",
      sw: "Mwendeshaji wa utalii anakagua majibu ya AI kabla ya kuyatumia",
    },
    place: { en: "Kigali, Rwanda", fr: "Kigali, Rwanda", sw: "Kigali, Rwanda" },
    sector: { en: "Tourism", fr: "Tourisme", sw: "Utalii" },
    situation: {
      en: "A small tour operator answers many emails about park permits, visas and travel rules. An AI assistant wrote fluent answers fast, but one reply stated a permit price that had changed months earlier. The owner had to refund the difference and apologise to the client.",
      fr: "Un petit voyagiste répond à beaucoup d’e-mails sur les permis de parc, les visas et les règles de voyage. Un assistant IA rédigeait vite des réponses fluides, mais l’une d’elles donnait un prix de permis qui avait changé des mois plus tôt. Le gérant a dû rembourser la différence et s’excuser auprès du client.",
      sw: "Mwendeshaji mdogo wa utalii hujibu barua pepe nyingi kuhusu vibali vya hifadhi, viza na sheria za usafiri. Msaidizi wa AI aliandika majibu mazuri haraka, lakini jibu moja lilitaja bei ya kibali iliyokuwa imebadilika miezi kadhaa iliyopita. Mmiliki alilazimika kurudisha tofauti na kumwomba mteja radhi.",
    },
    steps: {
      en: [
        "The team marked which facts must always be checked: prices, dates, legal rules and opening hours.",
        "For each of those, they open the official source and compare before sending.",
        "The AI still drafts the friendly parts; the checked facts are pasted in from the source.",
      ],
      fr: [
        "L’équipe a repéré les faits à toujours vérifier : prix, dates, règles légales et horaires.",
        "Pour chacun, elle ouvre la source officielle et compare avant l’envoi.",
        "L’IA rédige toujours les parties aimables ; les faits vérifiés sont copiés depuis la source.",
      ],
      sw: [
        "Timu iliweka alama kwenye taarifa zinazopaswa kukaguliwa kila mara: bei, tarehe, sheria na saa za kufungua.",
        "Kwa kila moja, wanafungua chanzo rasmi na kulinganisha kabla ya kutuma.",
        "AI bado inaandika sehemu za kirafiki; taarifa zilizokaguliwa zinanakiliwa kutoka kwenye chanzo.",
      ],
    },
    result: {
      en: "In this scenario, replies stay quick and friendly, and the facts in them can be traced to an official page. The owner trusts the drafts because she knows where they can go wrong.",
      fr: "Dans ce scénario, les réponses restent rapides et aimables, et chaque fait peut être relié à une page officielle. La gérante fait confiance aux brouillons parce qu’elle sait où ils peuvent se tromper.",
      sw: "Katika mfano huu, majibu yanabaki ya haraka na ya kirafiki, na taarifa ndani yake zinaweza kufuatiliwa hadi ukurasa rasmi. Mmiliki anaamini rasimu kwa sababu anajua zinaweza kukosea wapi.",
    },
    skills: {
      en: "Spotting hallucinations, checking claims against a source, knowing the limits of AI.",
      fr: "Repérer les hallucinations, vérifier une affirmation à la source, connaître les limites de l’IA.",
      sw: "Kutambua hallucination, kukagua madai dhidi ya chanzo, kujua mipaka ya AI.",
    },
    labSlug: "ai-foundations-lab-6-source-check",
  },

  // ── AI Practitioner ──────────────────────────────────────────────────────
  {
    id: "houston-hvac-quote-workflow",
    trackSlug: "ai-practitioner",
    title: {
      en: "An HVAC company maps its quote process before adding AI",
      fr: "Une entreprise de climatisation cartographie ses devis avant d’ajouter l’IA",
      sw: "Kampuni ya viyoyozi inachora mchakato wa nukuu kabla ya kuongeza AI",
    },
    place: { en: "Houston, USA", fr: "Houston, États-Unis", sw: "Houston, Marekani" },
    sector: { en: "Home services", fr: "Services à domicile", sw: "Huduma za nyumbani" },
    situation: {
      en: "A family-run heating and cooling company writes every quote by hand after a site visit. In the hot season, quotes wait days and some customers hire a competitor. The owner wanted \"AI for quotes\" but could not say which step was slow.",
      fr: "Une entreprise familiale de chauffage et climatisation rédige chaque devis à la main après une visite. En pleine saison chaude, les devis attendent des jours et certains clients partent chez un concurrent. Le patron voulait « l’IA pour les devis » sans savoir quelle étape était lente.",
      sw: "Kampuni ya familia ya joto na viyoyozi huandika kila nukuu kwa mkono baada ya kutembelea eneo. Katika msimu wa joto, nukuu zinasubiri siku kadhaa na baadhi ya wateja wanaenda kwa mshindani. Mmiliki alitaka \"AI kwa nukuu\" lakini hakuweza kusema hatua ipi ilikuwa ya polepole.",
    },
    steps: {
      en: [
        "The team drew the workflow from the first call to the signed quote, step by step.",
        "They found that turning the technician's notes into a clear written quote was the slow part.",
        "They wrote one reusable prompt that turns notes into a draft quote, which the owner reviews and prices.",
      ],
      fr: [
        "L’équipe a dessiné le processus, du premier appel au devis signé, étape par étape.",
        "Elle a vu que transformer les notes du technicien en devis clair était l’étape lente.",
        "Elle a écrit un prompt réutilisable qui transforme les notes en brouillon de devis, que le patron relit et chiffre.",
      ],
      sw: [
        "Timu ilichora mtiririko wa kazi kuanzia simu ya kwanza hadi nukuu iliyosainiwa, hatua kwa hatua.",
        "Waligundua kwamba kugeuza maelezo ya fundi kuwa nukuu iliyoandikwa vizuri ndiyo hatua ya polepole.",
        "Waliandika prompt moja inayoweza kutumika tena inayogeuza maelezo kuwa rasimu ya nukuu, ambayo mmiliki anaikagua na kuweka bei.",
      ],
    },
    result: {
      en: "In this scenario, quotes go out the same day, and prices stay a human decision. Mapping first meant AI was added where it helped, not everywhere.",
      fr: "Dans ce scénario, les devis partent le jour même, et les prix restent une décision humaine. Cartographier d’abord a permis d’ajouter l’IA là où elle aide, pas partout.",
      sw: "Katika mfano huu, nukuu zinatumwa siku hiyo hiyo, na bei zinabaki uamuzi wa binadamu. Kuchora kwanza kulisaidia AI kuongezwa mahali inaposaidia, si kila mahali.",
    },
    skills: {
      en: "Mapping a workflow, finding the step worth automating, writing reusable prompts.",
      fr: "Cartographier un processus, trouver l’étape qui vaut la peine d’être automatisée, écrire des prompts réutilisables.",
      sw: "Kuchora mtiririko wa kazi, kupata hatua inayofaa kuendeshwa kiotomatiki, kuandika prompt zinazotumika tena.",
    },
    labSlug: "ai-practitioner-lab-1-map-your-workflow",
  },
  {
    id: "accra-microfinance-field-notes",
    trackSlug: "ai-practitioner",
    title: {
      en: "A microfinance team checks AI summaries of field visits",
      fr: "Une équipe de microfinance vérifie les résumés IA des visites terrain",
      sw: "Timu ya mikopo midogo inakagua muhtasari wa AI wa ziara za uwanjani",
    },
    place: { en: "Accra, Ghana", fr: "Accra, Ghana", sw: "Accra, Ghana" },
    sector: { en: "Microfinance", fr: "Microfinance", sw: "Mikopo midogo" },
    situation: {
      en: "Loan officers write long notes after visiting market traders who apply for small loans. The credit committee asked for one-page summaries, and the team started using AI to write them. In one summary, a trader's two shops became \"two employees\", and nobody noticed until the meeting.",
      fr: "Les agents de crédit rédigent de longues notes après avoir rencontré des commerçantes qui demandent de petits prêts. Le comité de crédit voulait des résumés d’une page, et l’équipe a commencé à les faire écrire par l’IA. Dans un résumé, les deux boutiques d’une commerçante sont devenues « deux employés », et personne ne l’a vu avant la réunion.",
      sw: "Maafisa wa mikopo huandika maelezo marefu baada ya kutembelea wafanyabiashara wa sokoni wanaoomba mikopo midogo. Kamati ya mikopo iliomba muhtasari wa ukurasa mmoja, na timu ilianza kutumia AI kuuandika. Katika muhtasari mmoja, maduka mawili ya mfanyabiashara yakawa \"wafanyakazi wawili\", na hakuna aliyegundua hadi kwenye kikao.",
    },
    steps: {
      en: [
        "Each summary now lists the facts it relies on, so they can be ticked off against the notes.",
        "The officer who made the visit checks numbers, names and amounts line by line.",
        "Anything the notes do not say is marked \"not in the notes\" instead of being filled in.",
      ],
      fr: [
        "Chaque résumé liste désormais les faits sur lesquels il s’appuie, pour les cocher face aux notes.",
        "L’agent qui a fait la visite vérifie chiffres, noms et montants ligne par ligne.",
        "Ce que les notes ne disent pas est marqué « absent des notes » au lieu d’être inventé.",
      ],
      sw: [
        "Kila muhtasari sasa unaorodhesha taarifa unazotegemea, ili ziweze kuthibitishwa dhidi ya maelezo.",
        "Afisa aliyefanya ziara anakagua namba, majina na kiasi mstari kwa mstari.",
        "Chochote ambacho maelezo hayasemi kinaandikwa \"hakimo kwenye maelezo\" badala ya kubuniwa.",
      ],
    },
    result: {
      en: "In this scenario, the committee gets short summaries it can trust, and errors are caught by the person who knows the client. The check takes minutes because the summary shows its sources.",
      fr: "Dans ce scénario, le comité reçoit des résumés courts et fiables, et les erreurs sont repérées par la personne qui connaît la cliente. La vérification prend quelques minutes car le résumé montre ses sources.",
      sw: "Katika mfano huu, kamati inapata muhtasari mfupi inaoweza kuuamini, na makosa yanagunduliwa na mtu anayemjua mteja. Ukaguzi unachukua dakika chache kwa sababu muhtasari unaonyesha vyanzo vyake.",
    },
    skills: {
      en: "Checking a summary against its source, designing a simple quality check.",
      fr: "Vérifier un résumé face à sa source, concevoir un contrôle qualité simple.",
      sw: "Kukagua muhtasari dhidi ya chanzo chake, kubuni ukaguzi rahisi wa ubora.",
    },
    labSlug: "ai-practitioner-lab-3-check-a-summary-against-its-source",
  },
  {
    id: "atlanta-property-untrusted-email",
    trackSlug: "ai-practitioner",
    title: {
      en: "A property manager summarises tenant emails safely",
      fr: "Un gestionnaire immobilier résume les e-mails des locataires en sécurité",
      sw: "Meneja wa nyumba anafupisha barua pepe za wapangaji kwa usalama",
    },
    place: { en: "Atlanta, USA", fr: "Atlanta, États-Unis", sw: "Atlanta, Marekani" },
    sector: { en: "Real estate", fr: "Immobilier", sw: "Majengo" },
    situation: {
      en: "A small property management firm receives hundreds of tenant emails a week. They began pasting the inbox into an AI tool each morning to get a list of urgent repairs. One email contained hidden text telling the AI to mark that tenant's rent as paid.",
      fr: "Une petite société de gestion immobilière reçoit des centaines d’e-mails de locataires par semaine. Elle a commencé à coller la boîte de réception dans un outil d’IA chaque matin pour obtenir la liste des réparations urgentes. Un e-mail contenait un texte caché demandant à l’IA d’indiquer le loyer de ce locataire comme payé.",
      sw: "Kampuni ndogo ya usimamizi wa nyumba hupokea mamia ya barua pepe za wapangaji kila wiki. Walianza kubandika barua zote kwenye zana ya AI kila asubuhi ili kupata orodha ya matengenezo ya dharura. Barua pepe moja ilikuwa na maandishi yaliyofichwa yakiiambia AI iandike kodi ya mpangaji huyo kuwa imelipwa.",
    },
    steps: {
      en: [
        "The team now treats every email as data to summarise, never as instructions to follow.",
        "Their prompt says so plainly and asks the AI to flag any message that tries to give it orders.",
        "Payments and account changes are never decided from a summary: they are checked in the accounting system.",
      ],
      fr: [
        "L’équipe traite désormais chaque e-mail comme une donnée à résumer, jamais comme une consigne à suivre.",
        "Son prompt le dit clairement et demande à l’IA de signaler tout message qui essaie de lui donner des ordres.",
        "Paiements et changements de compte ne sont jamais décidés à partir d’un résumé : ils sont vérifiés dans la comptabilité.",
      ],
      sw: [
        "Timu sasa inachukulia kila barua pepe kama data ya kufupisha, kamwe si maagizo ya kufuata.",
        "Prompt yao inasema hivyo wazi na inaiomba AI iweke alama kwenye ujumbe wowote unaojaribu kuipa amri.",
        "Malipo na mabadiliko ya akaunti hayaamuliwi kamwe kutoka kwenye muhtasari: yanakaguliwa kwenye mfumo wa hesabu.",
      ],
    },
    result: {
      en: "In this scenario, the morning repair list still saves time, and the trick email is flagged instead of obeyed. The team understands why untrusted content needs its own rules.",
      fr: "Dans ce scénario, la liste matinale des réparations fait toujours gagner du temps, et l’e-mail piégé est signalé au lieu d’être obéi. L’équipe comprend pourquoi un contenu non fiable a besoin de ses propres règles.",
      sw: "Katika mfano huu, orodha ya asubuhi ya matengenezo bado inaokoa muda, na barua pepe ya hila inawekwa alama badala ya kutiiwa. Timu inaelewa kwa nini maudhui yasiyoaminika yanahitaji kanuni zake.",
    },
    skills: {
      en: "Prompt injection awareness, summarising untrusted content, keeping humans on money decisions.",
      fr: "Comprendre l’injection de prompt, résumer un contenu non fiable, garder l’humain sur les décisions d’argent.",
      sw: "Kuelewa prompt injection, kufupisha maudhui yasiyoaminika, kuacha maamuzi ya fedha kwa binadamu.",
    },
    labSlug: "ai-practitioner-lab-6-summarise-untrusted-content-safely",
  },

  // ── AI Systems Expert ────────────────────────────────────────────────────
  {
    id: "nairobi-broker-claims-rollout",
    trackSlug: "ai-systems-expert",
    title: {
      en: "An insurance broker maps a claims assistant as a system",
      fr: "Un courtier en assurance pense son assistant sinistres comme un système",
      sw: "Dalali wa bima anachora msaidizi wa madai kama mfumo",
    },
    place: { en: "Nairobi, Kenya", fr: "Nairobi, Kenya", sw: "Nairobi, Kenya" },
    sector: { en: "Insurance", fr: "Assurance", sw: "Bima" },
    situation: {
      en: "A mid-sized insurance broker planned an AI assistant to help clients file motor claims through WhatsApp. The first plan described only the chatbot. Nobody had asked who reviews unusual claims, what happens when the insurer's system is down, or how complaints come back.",
      fr: "Un courtier en assurance de taille moyenne prévoyait un assistant IA pour aider les clients à déclarer leurs sinistres auto sur WhatsApp. Le premier plan ne décrivait que le chatbot. Personne n’avait demandé qui examine les dossiers inhabituels, que faire si le système de l’assureur est en panne, ni comment remontent les plaintes.",
      sw: "Dalali wa bima wa ukubwa wa kati alipanga msaidizi wa AI kusaidia wateja kuwasilisha madai ya magari kupitia WhatsApp. Mpango wa kwanza ulieleza chatbot pekee. Hakuna aliyeuliza nani anakagua madai yasiyo ya kawaida, nini kinatokea mfumo wa kampuni ya bima ukiwa chini, au malalamiko yanarudi vipi.",
    },
    steps: {
      en: [
        "The team mapped the whole rollout: clients, agents, the insurer's system, data flows and feedback loops.",
        "They placed a human review point for claims above a set level or with missing documents.",
        "They named an owner for each part and a fallback for when any link fails.",
      ],
      fr: [
        "L’équipe a cartographié tout le déploiement : clients, agents, système de l’assureur, flux de données et boucles de retour.",
        "Elle a placé une revue humaine pour les sinistres au-dessus d’un certain seuil ou avec des pièces manquantes.",
        "Elle a nommé un responsable pour chaque partie et une solution de repli si un maillon tombe.",
      ],
      sw: [
        "Timu ilichora utekelezaji wote: wateja, mawakala, mfumo wa kampuni ya bima, mtiririko wa data na mizunguko ya maoni.",
        "Waliweka hatua ya ukaguzi wa binadamu kwa madai yanayozidi kiwango fulani au yenye nyaraka zinazokosekana.",
        "Walimteua mmiliki kwa kila sehemu na mpango mbadala kiungo chochote kikishindwa.",
      ],
    },
    result: {
      en: "In this scenario, the launch plan covers people and processes, not only the bot. Problems that would have surfaced as angry clients are designed out before go-live.",
      fr: "Dans ce scénario, le plan de lancement couvre les personnes et les processus, pas seulement le robot. Des problèmes qui seraient apparus sous forme de clients mécontents sont évités avant la mise en service.",
      sw: "Katika mfano huu, mpango wa uzinduzi unahusisha watu na michakato, si roboti pekee. Matatizo ambayo yangejitokeza kama wateja wenye hasira yanazuiwa kabla ya kuzinduliwa.",
    },
    skills: {
      en: "Systems thinking, human-in-the-loop design, rollout planning.",
      fr: "Pensée systémique, conception avec l’humain dans la boucle, planification du déploiement.",
      sw: "Kufikiri kimfumo, kubuni binadamu ndani ya mzunguko, kupanga utekelezaji.",
    },
    labSlug: "ai-systems-expert-lab-1-map-a-rollout-as-a-system",
  },
  {
    id: "charlotte-clinic-evaluation",
    trackSlug: "ai-systems-expert",
    title: {
      en: "A clinic group designs a test before trusting discharge notes",
      fr: "Un groupe de cliniques conçoit un test avant de se fier aux notes de sortie",
      sw: "Kundi la kliniki linabuni jaribio kabla ya kuamini maelezo ya kuruhusiwa",
    },
    place: { en: "Charlotte, USA", fr: "Charlotte, États-Unis", sw: "Charlotte, Marekani" },
    sector: { en: "Health care", fr: "Santé", sw: "Afya" },
    situation: {
      en: "A group of outpatient clinics tried an AI tool that turns doctors' notes into plain-language instructions for patients. The demo looked excellent. The medical director asked a simple question: how would they know it stays good on real, messy notes?",
      fr: "Un groupe de cliniques ambulatoires a essayé un outil d’IA qui transforme les notes des médecins en consignes simples pour les patients. La démonstration était excellente. Le directeur médical a posé une question simple : comment savoir que l’outil reste bon sur de vraies notes, désordonnées ?",
      sw: "Kundi la kliniki za wagonjwa wa nje lilijaribu zana ya AI inayogeuza maelezo ya madaktari kuwa maagizo rahisi kwa wagonjwa. Onyesho lilionekana bora sana. Mkurugenzi wa matibabu aliuliza swali rahisi: watajuaje kwamba inabaki nzuri kwenye maelezo halisi yenye fujo?",
    },
    steps: {
      en: [
        "Clinicians built a test set of anonymised notes, including hard cases: several medicines, unclear handwriting transcribed, allergies.",
        "They wrote a scoring rubric: correct doses, nothing invented, reading level, clear warning signs.",
        "The tool runs against the test set before launch and after every update; failures block release.",
      ],
      fr: [
        "Des soignants ont constitué un jeu de test de notes anonymisées, avec des cas difficiles : plusieurs médicaments, écriture peu lisible retranscrite, allergies.",
        "Ils ont écrit une grille de notation : doses exactes, rien d’inventé, niveau de lecture, signes d’alerte clairs.",
        "L’outil passe le jeu de test avant le lancement et après chaque mise à jour ; un échec bloque la mise en production.",
      ],
      sw: [
        "Wahudumu wa afya waliunda seti ya majaribio ya maelezo yasiyo na majina, ikiwemo kesi ngumu: dawa nyingi, mwandiko usio wazi uliodondolewa, mzio.",
        "Waliandika kigezo cha alama: dozi sahihi, hakuna kilichobuniwa, kiwango cha usomaji, ishara za hatari zilizo wazi.",
        "Zana inapimwa kwa seti hiyo kabla ya uzinduzi na baada ya kila sasisho; kushindwa kunazuia kutolewa.",
      ],
    },
    result: {
      en: "In this scenario, the clinics decide with evidence rather than a demo, and they find two weak spots before any patient sees them. The test set becomes a lasting safety net.",
      fr: "Dans ce scénario, les cliniques décident sur preuves et non sur une démonstration, et repèrent deux points faibles avant qu’un patient ne les voie. Le jeu de test devient un filet de sécurité durable.",
      sw: "Katika mfano huu, kliniki zinaamua kwa ushahidi badala ya onyesho, na zinagundua udhaifu miwili kabla mgonjwa yeyote hajauona. Seti ya majaribio inakuwa kinga ya kudumu.",
    },
    skills: {
      en: "Designing evaluations, test sets and rubrics, release gates.",
      fr: "Concevoir des évaluations, jeux de test et grilles, critères de mise en production.",
      sw: "Kubuni tathmini, seti za majaribio na vigezo, vizuizi vya utoaji.",
    },
    labSlug: "ai-systems-expert-lab-3-design-an-evaluation",
  },
  {
    id: "johannesburg-retail-cost-model",
    trackSlug: "ai-systems-expert",
    title: {
      en: "A retailer models cost and value before scaling a support bot",
      fr: "Un détaillant modélise coûts et valeur avant d’étendre un robot d’assistance",
      sw: "Muuzaji anapima gharama na thamani kabla ya kupanua roboti ya huduma",
    },
    place: { en: "Johannesburg, South Africa", fr: "Johannesburg, Afrique du Sud", sw: "Johannesburg, Afrika Kusini" },
    sector: { en: "Retail", fr: "Commerce de détail", sw: "Rejareja" },
    situation: {
      en: "A homeware retailer ran a customer support assistant in one store's online channel. Leaders wanted to roll it out to every channel. The finance lead asked what it really costs per conversation and what it saves, and nobody had the numbers.",
      fr: "Un détaillant d’articles pour la maison utilisait un assistant client sur le canal en ligne d’un magasin. La direction voulait l’étendre à tous les canaux. Le responsable financier a demandé ce qu’il coûte vraiment par conversation et ce qu’il fait économiser, et personne n’avait les chiffres.",
      sw: "Muuzaji wa vifaa vya nyumbani aliendesha msaidizi wa huduma kwa wateja kwenye mtandao wa duka moja. Viongozi walitaka kuusambaza kwenye kila njia. Mkuu wa fedha aliuliza unagharimu kiasi gani kwa kila mazungumzo na unaokoa nini, na hakuna aliyekuwa na takwimu.",
    },
    steps: {
      en: [
        "The team listed every cost: model usage, hosting, monitoring, staff time to review hand-offs.",
        "They measured, from their own pilot logs, how many conversations ended without a human.",
        "They built a simple model with low, likely and high cases and agreed a limit that pauses the rollout.",
      ],
      fr: [
        "L’équipe a listé tous les coûts : utilisation du modèle, hébergement, supervision, temps du personnel pour reprendre les échanges.",
        "Elle a mesuré, dans les journaux de son propre pilote, combien de conversations se terminaient sans humain.",
        "Elle a construit un modèle simple avec des cas bas, probable et haut, et fixé un seuil qui suspend le déploiement.",
      ],
      sw: [
        "Timu iliorodhesha kila gharama: matumizi ya modeli, uhifadhi, ufuatiliaji, muda wa wafanyakazi kupokea mazungumzo yaliyohamishwa.",
        "Walipima, kutoka kwenye kumbukumbu za majaribio yao, mazungumzo mangapi yaliisha bila binadamu.",
        "Walijenga modeli rahisi yenye hali ya chini, inayowezekana na ya juu, na wakakubaliana kikomo kinachosimamisha upanuzi.",
      ],
    },
    result: {
      en: "In this scenario, the rollout decision rests on the company's own pilot data, with a clear stop rule. Leaders and finance argue about assumptions, not guesses.",
      fr: "Dans ce scénario, la décision de déploiement repose sur les données du pilote de l’entreprise, avec une règle d’arrêt claire. Direction et finance débattent d’hypothèses, pas de suppositions.",
      sw: "Katika mfano huu, uamuzi wa upanuzi unategemea data ya majaribio ya kampuni yenyewe, pamoja na kanuni wazi ya kusimama. Viongozi na fedha wanajadili dhana, si makisio.",
    },
    skills: {
      en: "Cost and value modelling, pilots, decision rules for scaling.",
      fr: "Modéliser coûts et valeur, pilotes, règles de décision pour passer à l’échelle.",
      sw: "Kupima gharama na thamani, majaribio, kanuni za maamuzi ya kupanua.",
    },
    labSlug: "ai-systems-expert-lab-6-cost-and-value-model",
  },

  // ── Vibe Coding Like a Software Engineer ─────────────────────────────────
  {
    id: "dakar-clinic-booking-spec",
    trackSlug: "vibe-coding-engineer",
    title: {
      en: "A clinic writes a spec before asking AI to build its booking app",
      fr: "Une clinique écrit un cahier des charges avant de faire coder son app de rendez-vous",
      sw: "Kliniki inaandika maelezo ya mradi kabla ya kuiomba AI ijenge programu ya miadi",
    },
    place: { en: "Dakar, Senegal", fr: "Dakar, Sénégal", sw: "Dakar, Senegal" },
    sector: { en: "Health care", fr: "Santé", sw: "Afya" },
    situation: {
      en: "A private clinic wanted patients to book appointments online instead of queuing at dawn. The administrator asked an AI coding tool to \"make a booking app\" and got something that looked good but double-booked doctors. Each fix broke something else.",
      fr: "Une clinique privée voulait que les patients prennent rendez-vous en ligne au lieu de faire la queue dès l’aube. L’administrateur a demandé à un outil de code IA de « faire une app de rendez-vous » et a obtenu quelque chose de joli qui réservait deux fois le même médecin. Chaque correction cassait autre chose.",
      sw: "Kliniki binafsi ilitaka wagonjwa wapange miadi mtandaoni badala ya kupanga foleni alfajiri. Msimamizi aliiomba zana ya AI ya kuandika msimbo \"itengeneze programu ya miadi\" na akapata kitu kilichoonekana kizuri lakini kilichopanga daktari mmoja mara mbili. Kila marekebisho yaliharibu kitu kingine.",
    },
    steps: {
      en: [
        "He started again with a short written spec: who books, what a slot is, the rule that a doctor has one patient per slot.",
        "He listed what is out of scope for the first version, such as payments.",
        "He asked the AI to build one feature at a time and checked each one against the spec.",
      ],
      fr: [
        "Il est reparti d’un court cahier des charges écrit : qui réserve, ce qu’est un créneau, la règle d’un patient par créneau et par médecin.",
        "Il a listé ce qui est hors du périmètre de la première version, comme les paiements.",
        "Il a demandé à l’IA de construire une fonction à la fois et a vérifié chacune face au cahier des charges.",
      ],
      sw: [
        "Alianza upya kwa maelezo mafupi ya maandishi: nani anapanga miadi, nafasi ni nini, kanuni kwamba daktari ana mgonjwa mmoja kwa kila nafasi.",
        "Aliorodhesha kisichohusika katika toleo la kwanza, kama malipo.",
        "Aliiomba AI ijenge kipengele kimoja kwa wakati na akakagua kila kimoja dhidi ya maelezo.",
      ],
    },
    result: {
      en: "In this scenario, the second build is smaller and correct, and the spec becomes the checklist for testing. The clinic knows exactly what the app promises.",
      fr: "Dans ce scénario, la deuxième version est plus petite et correcte, et le cahier des charges devient la liste de contrôle des tests. La clinique sait exactement ce que l’app promet.",
      sw: "Katika mfano huu, ujenzi wa pili ni mdogo zaidi na sahihi, na maelezo yanakuwa orodha ya ukaguzi wa majaribio. Kliniki inajua hasa programu inaahidi nini.",
    },
    skills: {
      en: "Writing a build-ready spec, scoping, building in small steps.",
      fr: "Écrire un cahier des charges prêt à coder, cadrer le périmètre, construire par petites étapes.",
      sw: "Kuandika maelezo tayari kwa ujenzi, kuweka mipaka, kujenga kwa hatua ndogo.",
    },
    labSlug: "vibe-coding-lab-2-write-a-build-ready-spec",
  },
  {
    id: "memphis-food-truck-bug",
    trackSlug: "vibe-coding-engineer",
    title: {
      en: "A food truck co-op proves a payment bug is fixed",
      fr: "Une coopérative de food trucks prouve qu’un bug de paiement est corrigé",
      sw: "Ushirika wa magari ya chakula unathibitisha kwamba hitilafu ya malipo imerekebishwa",
    },
    place: { en: "Memphis, USA", fr: "Memphis, États-Unis", sw: "Memphis, Marekani" },
    sector: { en: "Food service", fr: "Restauration", sw: "Huduma ya chakula" },
    situation: {
      en: "A co-op of food trucks shares a simple pre-order web app built with AI help. Some customers were charged twice when they tapped \"Pay\" on a slow connection. The volunteer developer asked the AI to fix it, and it said it had, but the problem came back a week later.",
      fr: "Une coopérative de food trucks partage une app web de précommande construite avec l’aide de l’IA. Certains clients étaient débités deux fois en touchant « Payer » sur une connexion lente. Le développeur bénévole a demandé à l’IA de corriger, elle a dit l’avoir fait, mais le problème est revenu une semaine plus tard.",
      sw: "Ushirika wa magari ya chakula unatumia programu rahisi ya kuagiza kabla iliyojengwa kwa msaada wa AI. Baadhi ya wateja walitozwa mara mbili walipobonyeza \"Lipa\" kwenye mtandao wa polepole. Msanidi wa kujitolea aliiomba AI irekebishe, ikasema imerekebisha, lakini tatizo lilirudi wiki moja baadaye.",
    },
    steps: {
      en: [
        "He first reproduced the bug on purpose by simulating a slow double tap.",
        "He wrote a test that fails while the bug exists.",
        "Only then did he ask the AI for a fix, and accepted it when the test passed and stayed in the test suite.",
      ],
      fr: [
        "Il a d’abord reproduit le bug volontairement en simulant un double appui lent.",
        "Il a écrit un test qui échoue tant que le bug existe.",
        "Ensuite seulement il a demandé une correction à l’IA, acceptée quand le test est passé, et le test est resté dans la suite.",
      ],
      sw: [
        "Kwanza aliizalisha hitilafu kwa makusudi kwa kuiga kubonyeza mara mbili kwa polepole.",
        "Aliandika jaribio linaloshindwa wakati hitilafu ipo.",
        "Ndipo tu alipoiomba AI marekebisho, na akayakubali jaribio lilipofaulu, na jaribio likabaki kwenye seti ya majaribio.",
      ],
    },
    result: {
      en: "In this scenario, the fix is proven, not just claimed, and the test guards against the bug returning. The co-op stops refunding double charges.",
      fr: "Dans ce scénario, la correction est prouvée, pas seulement annoncée, et le test empêche le bug de revenir. La coopérative n’a plus à rembourser de doubles débits.",
      sw: "Katika mfano huu, marekebisho yamethibitishwa, si kudaiwa tu, na jaribio linazuia hitilafu kurudi. Ushirika unaacha kurudisha malipo yaliyotozwa mara mbili.",
    },
    skills: {
      en: "Reproducing bugs, writing a failing test first, verifying AI-written fixes.",
      fr: "Reproduire un bug, écrire d’abord un test qui échoue, vérifier les corrections écrites par l’IA.",
      sw: "Kuzalisha hitilafu, kuandika kwanza jaribio linaloshindwa, kuthibitisha marekebisho yaliyoandikwa na AI.",
    },
    labSlug: "vibe-coding-lab-4-fix-the-bug-then-prove-it",
  },
  {
    id: "kampala-school-fees-security",
    trackSlug: "vibe-coding-engineer",
    title: {
      en: "A school reviews its fees portal for security before launch",
      fr: "Une école vérifie la sécurité de son portail de frais avant le lancement",
      sw: "Shule inakagua usalama wa tovuti yake ya ada kabla ya kuzindua",
    },
    place: { en: "Kampala, Uganda", fr: "Kampala, Ouganda", sw: "Kampala, Uganda" },
    sector: { en: "Education", fr: "Éducation", sw: "Elimu" },
    situation: {
      en: "A secondary school's bursar built a portal where parents see fee balances, using an AI coding assistant. It worked well in testing. Before launch, a parent who works in IT noticed that changing a number in the web address showed another family's balance.",
      fr: "L’économe d’un lycée a construit, avec un assistant de code IA, un portail où les parents voient le solde des frais. Il fonctionnait bien en test. Avant le lancement, un parent qui travaille dans l’informatique a remarqué qu’en changeant un chiffre dans l’adresse web, on voyait le solde d’une autre famille.",
      sw: "Mhasibu wa shule ya sekondari alijenga tovuti ambapo wazazi wanaona salio la ada, kwa kutumia msaidizi wa AI wa kuandika msimbo. Ilifanya kazi vizuri kwenye majaribio. Kabla ya uzinduzi, mzazi anayefanya kazi ya TEHAMA aligundua kwamba kubadilisha namba kwenye anwani ya tovuti kulionyesha salio la familia nyingine.",
    },
    steps: {
      en: [
        "The school paused the launch and ran a security review with a checklist: sign-in on every page, each family sees only its own records, no secrets in the code.",
        "Each issue found was fixed and re-tested by trying the same trick again.",
        "A short security report now goes with every new feature.",
      ],
      fr: [
        "L’école a suspendu le lancement et fait une revue de sécurité avec une liste : connexion sur chaque page, chaque famille ne voit que ses propres données, aucun secret dans le code.",
        "Chaque problème trouvé a été corrigé puis retesté en refaisant la même manipulation.",
        "Un court rapport de sécurité accompagne désormais chaque nouvelle fonction.",
      ],
      sw: [
        "Shule ilisimamisha uzinduzi na kufanya ukaguzi wa usalama kwa orodha: kuingia kwenye kila ukurasa, kila familia inaona rekodi zake tu, hakuna siri ndani ya msimbo.",
        "Kila tatizo lililopatikana lilirekebishwa na kujaribiwa tena kwa kujaribu hila ile ile.",
        "Ripoti fupi ya usalama sasa inaambatana na kila kipengele kipya.",
      ],
    },
    result: {
      en: "In this scenario, families' data stays private and the school launches with confidence. The bursar learns that \"it works\" and \"it is safe\" are two different checks.",
      fr: "Dans ce scénario, les données des familles restent privées et l’école lance le portail en confiance. L’économe apprend que « ça marche » et « c’est sûr » sont deux vérifications différentes.",
      sw: "Katika mfano huu, data za familia zinabaki za siri na shule inazindua kwa kujiamini. Mhasibu anajifunza kwamba \"inafanya kazi\" na \"ni salama\" ni ukaguzi miwili tofauti.",
    },
    skills: {
      en: "Security review, access control (IDOR), shipping safely.",
      fr: "Revue de sécurité, contrôle d’accès (IDOR), mise en ligne sûre.",
      sw: "Ukaguzi wa usalama, udhibiti wa ufikiaji (IDOR), kuzindua kwa usalama.",
    },
    labSlug: "vibe-coding-lab-5-security-review",
  },

  // ── Building AI Apps and Agents ──────────────────────────────────────────
  {
    id: "abidjan-coop-rag-citations",
    trackSlug: "ai-apps-agents",
    title: {
      en: "A cocoa cooperative answers members from its own documents",
      fr: "Une coopérative de cacao répond aux membres à partir de ses propres documents",
      sw: "Ushirika wa kakao unawajibu wanachama kutoka kwenye nyaraka zake",
    },
    place: { en: "Abidjan, Côte d’Ivoire", fr: "Abidjan, Côte d’Ivoire", sw: "Abidjan, Côte d’Ivoire" },
    sector: { en: "Agriculture", fr: "Agriculture", sw: "Kilimo" },
    situation: {
      en: "A farmers' cooperative gets the same questions every season: payment dates, quality rules, how to join the training days. The answers are in its own handbooks and meeting notes, which few members read. A general chatbot gave confident answers that did not match the cooperative's rules.",
      fr: "Une coopérative agricole reçoit les mêmes questions à chaque saison : dates de paiement, règles de qualité, inscription aux formations. Les réponses sont dans ses guides et comptes rendus, que peu de membres lisent. Un chatbot généraliste répondait avec assurance, mais pas selon les règles de la coopérative.",
      sw: "Ushirika wa wakulima hupokea maswali yale yale kila msimu: tarehe za malipo, kanuni za ubora, jinsi ya kujiunga na siku za mafunzo. Majibu yamo kwenye vitabu vyake vya mwongozo na kumbukumbu za vikao, ambavyo wanachama wachache husoma. Chatbot ya jumla ilitoa majibu ya kujiamini yasiyolingana na kanuni za ushirika.",
    },
    steps: {
      en: [
        "The developer built a small retrieval step that finds the relevant passages in the cooperative's documents.",
        "The model must answer only from those passages and cite the document and section.",
        "When nothing relevant is found, the assistant says so and gives the office phone number.",
      ],
      fr: [
        "Le développeur a construit une petite étape de recherche qui trouve les passages utiles dans les documents de la coopérative.",
        "Le modèle doit répondre uniquement à partir de ces passages et citer le document et la section.",
        "Quand rien de pertinent n’est trouvé, l’assistant le dit et donne le numéro du bureau.",
      ],
      sw: [
        "Msanidi alijenga hatua ndogo ya utafutaji inayopata vifungu husika kwenye nyaraka za ushirika.",
        "Modeli lazima ijibu kutoka kwenye vifungu hivyo tu na itaje hati na sehemu.",
        "Kisipopatikana kitu husika, msaidizi anasema hivyo na anatoa namba ya simu ya ofisi.",
      ],
    },
    result: {
      en: "In this scenario, members get answers they can check, in the cooperative's own words. Staff spend less time repeating the same information and more time on real problems.",
      fr: "Dans ce scénario, les membres obtiennent des réponses vérifiables, avec les mots de la coopérative. Le personnel passe moins de temps à répéter les mêmes informations et plus sur les vrais problèmes.",
      sw: "Katika mfano huu, wanachama wanapata majibu wanayoweza kukagua, kwa maneno ya ushirika wenyewe. Wafanyakazi wanatumia muda mchache kurudia taarifa zile zile na zaidi kwenye matatizo halisi.",
    },
    skills: {
      en: "Retrieval-augmented generation (RAG), grounding, citations, refusing when unsure.",
      fr: "Génération augmentée par la recherche (RAG), ancrage, citations, savoir dire « je ne sais pas ».",
      sw: "RAG, kuegemeza majibu kwenye vyanzo, kutaja vyanzo, kukataa wakati huna uhakika.",
    },
    labSlug: "ai-agents-lab-4-mini-rag-with-citations",
  },
  {
    id: "phoenix-solar-booking-agent",
    trackSlug: "ai-apps-agents",
    title: {
      en: "A solar installer lets an agent book site visits, with limits",
      fr: "Un installateur solaire laisse un agent réserver les visites, avec des limites",
      sw: "Kisakinishi cha sola kinaruhusu agent kupanga ziara, kwa mipaka",
    },
    place: { en: "Phoenix, USA", fr: "Phoenix, États-Unis", sw: "Phoenix, Marekani" },
    sector: { en: "Energy", fr: "Énergie", sw: "Nishati" },
    situation: {
      en: "A rooftop solar installer receives many website enquiries outside office hours. They wanted an assistant that could check the calendar and book a site survey. The first prototype booked visits in areas the company does not serve.",
      fr: "Un installateur de panneaux solaires reçoit beaucoup de demandes sur son site en dehors des heures de bureau. Il voulait un assistant capable de consulter l’agenda et de réserver une visite technique. Le premier prototype réservait des visites dans des zones que l’entreprise ne couvre pas.",
      sw: "Kisakinishi cha sola za paa hupokea maombi mengi ya tovuti nje ya saa za kazi. Walitaka msaidizi anayeweza kuangalia kalenda na kupanga ukaguzi wa eneo. Mfano wa kwanza ulipanga ziara katika maeneo ambayo kampuni haihudumii.",
    },
    steps: {
      en: [
        "The developer gave the agent three narrow tools: check the service area, list free slots, create a booking.",
        "The code, not the model, enforces the rules: the booking tool refuses addresses outside the area.",
        "The loop stops after a few steps, and every booking is confirmed to the customer and to staff.",
      ],
      fr: [
        "Le développeur a donné à l’agent trois outils précis : vérifier la zone desservie, lister les créneaux libres, créer une réservation.",
        "C’est le code, pas le modèle, qui applique les règles : l’outil de réservation refuse les adresses hors zone.",
        "La boucle s’arrête après quelques étapes, et chaque réservation est confirmée au client et à l’équipe.",
      ],
      sw: [
        "Msanidi alimpa agent zana tatu finyu: kuangalia eneo la huduma, kuorodhesha nafasi wazi, kuunda miadi.",
        "Msimbo, si modeli, ndio unaosimamia kanuni: zana ya kupanga inakataa anwani zilizo nje ya eneo.",
        "Mzunguko unasimama baada ya hatua chache, na kila miadi inathibitishwa kwa mteja na kwa wafanyakazi.",
      ],
    },
    result: {
      en: "In this scenario, evening enquiries turn into booked visits by morning, and no booking breaks a business rule. Staff review a short list instead of an inbox.",
      fr: "Dans ce scénario, les demandes du soir deviennent des visites réservées au matin, et aucune réservation n’enfreint une règle de l’entreprise. L’équipe relit une courte liste au lieu d’une boîte de réception.",
      sw: "Katika mfano huu, maombi ya jioni yanakuwa ziara zilizopangwa kufikia asubuhi, na hakuna miadi inayovunja kanuni za biashara. Wafanyakazi wanakagua orodha fupi badala ya sanduku la barua.",
    },
    skills: {
      en: "Tool calling, agent loops with limits, enforcing rules in code.",
      fr: "Appel d’outils, boucles d’agent limitées, règles appliquées dans le code.",
      sw: "Kuita zana, mizunguko ya agent yenye mipaka, kusimamia kanuni ndani ya msimbo.",
    },
    labSlug: "ai-agents-lab-3-tool-calling-loop",
  },
  {
    id: "kano-orders-json-repair",
    trackSlug: "ai-apps-agents",
    title: {
      en: "A wholesaler turns chat orders into clean data",
      fr: "Un grossiste transforme les commandes par messagerie en données propres",
      sw: "Mfanyabiashara wa jumla anageuza oda za gumzo kuwa data safi",
    },
    place: { en: "Kano, Nigeria", fr: "Kano, Nigeria", sw: "Kano, Nigeria" },
    sector: { en: "Wholesale", fr: "Commerce de gros", sw: "Biashara ya jumla" },
    situation: {
      en: "A food wholesaler takes most orders by chat, written in a mix of English and Hausa. Staff retyped them into a spreadsheet each evening. An AI extraction script helped, but sometimes returned broken data that stopped the import.",
      fr: "Un grossiste alimentaire reçoit la plupart de ses commandes par messagerie, écrites en anglais et en haoussa mélangés. Le personnel les ressaisissait chaque soir dans un tableur. Un script d’extraction par IA aidait, mais renvoyait parfois des données cassées qui bloquaient l’import.",
      sw: "Mfanyabiashara wa jumla wa vyakula hupokea oda nyingi kwa gumzo, zilizoandikwa kwa mchanganyiko wa Kiingereza na Kihausa. Wafanyakazi walizichapa upya kwenye jedwali kila jioni. Skripti ya AI ya kutoa taarifa ilisaidia, lakini wakati mwingine ilirudisha data mbovu iliyozuia uingizaji.",
    },
    steps: {
      en: [
        "The developer defined the exact JSON shape of an order: customer, items, quantities, delivery day.",
        "Every model reply is validated against that shape; a broken reply gets one repair attempt with the error message.",
        "Orders that still fail go to a person, with the original message beside them.",
      ],
      fr: [
        "Le développeur a défini la forme JSON exacte d’une commande : client, articles, quantités, jour de livraison.",
        "Chaque réponse du modèle est validée face à cette forme ; une réponse cassée a droit à une tentative de réparation avec le message d’erreur.",
        "Les commandes qui échouent encore vont à une personne, avec le message d’origine à côté.",
      ],
      sw: [
        "Msanidi alifafanua muundo kamili wa JSON wa oda: mteja, bidhaa, idadi, siku ya kufikisha.",
        "Kila jibu la modeli linathibitishwa dhidi ya muundo huo; jibu bovu linapata jaribio moja la kurekebishwa pamoja na ujumbe wa hitilafu.",
        "Oda zinazoshindwa bado zinaenda kwa mtu, pamoja na ujumbe wa asili kando yake.",
      ],
    },
    result: {
      en: "In this scenario, the import never breaks on bad data, and staff only handle the few unclear orders. The evening retyping shift becomes a short review.",
      fr: "Dans ce scénario, l’import ne casse plus sur des données erronées, et le personnel ne traite que les quelques commandes floues. La soirée de ressaisie devient une courte vérification.",
      sw: "Katika mfano huu, uingizaji hauvunjiki kwa data mbovu, na wafanyakazi wanashughulikia oda chache zisizo wazi tu. Zamu ya jioni ya kuchapa upya inakuwa ukaguzi mfupi.",
    },
    skills: {
      en: "Structured output, JSON validation and repair, fallbacks to a human.",
      fr: "Sortie structurée, validation et réparation de JSON, repli vers un humain.",
      sw: "Matokeo yenye muundo, kuthibitisha na kurekebisha JSON, kumrudishia binadamu.",
    },
    labSlug: "ai-agents-lab-2-validate-and-repair-json",
  },

  // ── Becoming the AI-Forward Professional ─────────────────────────────────
  {
    id: "douala-accountant-task-inventory",
    trackSlug: "ai-forward-professional",
    title: {
      en: "An accountant lists her tasks to see where AI fits",
      fr: "Une comptable liste ses tâches pour voir où l’IA a sa place",
      sw: "Mhasibu anaorodhesha kazi zake kuona AI inafaa wapi",
    },
    place: { en: "Douala, Cameroon", fr: "Douala, Cameroun", sw: "Douala, Kamerun" },
    sector: { en: "Accounting", fr: "Comptabilité", sw: "Uhasibu" },
    situation: {
      en: "A chartered accountant in a small firm felt pressure to \"use AI\" but did not know where to start. She tried it on tax questions and got answers she could not rely on. She was close to giving up.",
      fr: "Une expert-comptable dans un petit cabinet sentait la pression d’« utiliser l’IA » sans savoir par où commencer. Elle l’a essayée sur des questions fiscales et a obtenu des réponses peu fiables. Elle était sur le point d’abandonner.",
      sw: "Mhasibu aliyesajiliwa katika kampuni ndogo alihisi shinikizo la \"kutumia AI\" lakini hakujua aanzie wapi. Aliijaribu kwenye maswali ya kodi na akapata majibu asiyoweza kuyategemea. Alikaribia kukata tamaa.",
    },
    steps: {
      en: [
        "She listed a normal week's tasks and marked each by time spent, risk and how much judgement it needs.",
        "Low-risk writing tasks (client reminders, meeting notes, first drafts of letters) came out on top.",
        "Tax advice stayed with her; AI only helps her explain it in plain words once she has decided.",
      ],
      fr: [
        "Elle a listé les tâches d’une semaine normale et noté pour chacune le temps passé, le risque et la part de jugement.",
        "Les tâches d’écriture à faible risque (relances clients, comptes rendus, premiers jets de lettres) sont arrivées en tête.",
        "Le conseil fiscal reste son affaire ; l’IA l’aide seulement à l’expliquer simplement une fois sa décision prise.",
      ],
      sw: [
        "Aliorodhesha kazi za wiki ya kawaida na kuweka alama kwa kila moja kulingana na muda, hatari na kiasi cha busara kinachohitajika.",
        "Kazi za kuandika zenye hatari ndogo (ukumbusho kwa wateja, kumbukumbu za vikao, rasimu za kwanza za barua) zilikuwa juu.",
        "Ushauri wa kodi ulibaki kwake; AI inamsaidia tu kuueleza kwa maneno rahisi baada ya kuamua.",
      ],
    },
    result: {
      en: "In this scenario, she gets her first real wins on routine writing within a week, without risking her professional judgement. She now has a clear rule for what AI does and does not do in her work.",
      fr: "Dans ce scénario, elle obtient ses premiers vrais gains sur l’écriture courante en une semaine, sans risquer son jugement professionnel. Elle a maintenant une règle claire sur ce que l’IA fait ou non dans son travail.",
      sw: "Katika mfano huu, anapata mafanikio yake ya kwanza halisi kwenye uandishi wa kawaida ndani ya wiki moja, bila kuhatarisha busara yake ya kitaaluma. Sasa ana kanuni wazi ya kile AI inafanya na isichofanya katika kazi yake.",
    },
    skills: {
      en: "Task inventory, choosing low-risk first wins, keeping professional judgement.",
      fr: "Inventaire des tâches, choisir des premiers gains à faible risque, garder son jugement professionnel.",
      sw: "Orodha ya kazi, kuchagua mafanikio ya kwanza yenye hatari ndogo, kudumisha busara ya kitaaluma.",
    },
    labSlug: "ai-forward-lab-4-task-inventory",
  },
  {
    id: "raleigh-hr-pilot-pitch",
    trackSlug: "ai-forward-professional",
    title: {
      en: "An HR manager runs a small pilot, then pitches it",
      fr: "Une responsable RH mène un petit pilote, puis le présente",
      sw: "Meneja wa rasilimali watu anaendesha majaribio madogo, kisha anayawasilisha",
    },
    place: { en: "Raleigh, USA", fr: "Raleigh, États-Unis", sw: "Raleigh, Marekani" },
    sector: { en: "Human resources", fr: "Ressources humaines", sw: "Rasilimali watu" },
    situation: {
      en: "An HR manager at a regional manufacturer answers the same policy questions from staff every day. She believed AI could help draft answers from the employee handbook. Leadership was wary after reading stories about AI mistakes.",
      fr: "Une responsable RH d’un fabricant régional répond chaque jour aux mêmes questions du personnel sur les règles internes. Elle pensait que l’IA pouvait aider à rédiger des réponses à partir du manuel des employés. La direction était méfiante après avoir lu des histoires d’erreurs de l’IA.",
      sw: "Meneja wa rasilimali watu katika kiwanda cha kikanda hujibu maswali yale yale ya sera kutoka kwa wafanyakazi kila siku. Aliamini AI inaweza kusaidia kuandika majibu kutoka kwenye kitabu cha mwongozo wa wafanyakazi. Uongozi ulikuwa na wasiwasi baada ya kusoma habari za makosa ya AI.",
    },
    steps: {
      en: [
        "She ran a four-week pilot on her own desk only, keeping a simple log of each question, the draft and her edits.",
        "She noted where drafts were wrong and how she caught it.",
        "She pitched a next step with clear limits: drafts only, always reviewed, no medical or legal questions.",
      ],
      fr: [
        "Elle a mené un pilote de quatre semaines sur son seul poste, avec un journal simple de chaque question, du brouillon et de ses corrections.",
        "Elle a noté où les brouillons étaient faux et comment elle l’avait vu.",
        "Elle a proposé une étape suivante avec des limites claires : brouillons seulement, toujours relus, pas de questions médicales ou juridiques.",
      ],
      sw: [
        "Aliendesha majaribio ya wiki nne kwenye meza yake pekee, akiweka kumbukumbu rahisi ya kila swali, rasimu na marekebisho yake.",
        "Aliandika mahali rasimu zilikuwa na makosa na jinsi alivyogundua.",
        "Aliwasilisha hatua inayofuata yenye mipaka wazi: rasimu tu, zinakaguliwa kila mara, hakuna maswali ya kitabibu au kisheria.",
      ],
    },
    result: {
      en: "In this scenario, leadership approves a wider trial because the pitch shows real examples, honest failures and safeguards. The log becomes the training material for colleagues.",
      fr: "Dans ce scénario, la direction approuve un essai plus large parce que la présentation montre de vrais exemples, des échecs assumés et des garde-fous. Le journal devient le support de formation des collègues.",
      sw: "Katika mfano huu, uongozi unaidhinisha jaribio pana kwa sababu uwasilishaji unaonyesha mifano halisi, makosa ya kweli na kinga. Kumbukumbu zinakuwa nyenzo za mafunzo kwa wenzake.",
    },
    skills: {
      en: "Running a small pilot, measuring honestly, making the case to leadership.",
      fr: "Mener un petit pilote, mesurer honnêtement, convaincre la direction.",
      sw: "Kuendesha majaribio madogo, kupima kwa uaminifu, kuwashawishi viongozi.",
    },
    labSlug: "ai-forward-lab-5-pilot-and-pitch",
  },
  {
    id: "addis-ngo-report-template",
    trackSlug: "ai-forward-professional",
    title: {
      en: "An NGO officer builds a reusable report prompt",
      fr: "Un chargé de programme d’ONG crée un prompt de rapport réutilisable",
      sw: "Afisa wa shirika lisilo la kiserikali anaunda prompt ya ripoti inayotumika tena",
    },
    place: { en: "Addis Ababa, Ethiopia", fr: "Addis-Abeba, Éthiopie", sw: "Addis Ababa, Ethiopia" },
    sector: { en: "Non-profit", fr: "Associatif", sw: "Mashirika yasiyo ya faida" },
    situation: {
      en: "A programme officer writes monthly donor updates from field reports sent by five project sites. Each month he wrote a new prompt from scratch, and the results varied in length, tone and structure. Donors noticed the inconsistency.",
      fr: "Un chargé de programme rédige chaque mois des points pour les bailleurs à partir des rapports de cinq sites. Chaque mois il réécrivait un prompt de zéro, et les résultats variaient en longueur, ton et structure. Les bailleurs ont remarqué ce manque de cohérence.",
      sw: "Afisa wa programu huandika taarifa za kila mwezi kwa wafadhili kutoka kwenye ripoti za maeneo matano ya miradi. Kila mwezi aliandika prompt mpya kuanzia mwanzo, na matokeo yalitofautiana kwa urefu, sauti na muundo. Wafadhili waliona kutolingana huko.",
    },
    steps: {
      en: [
        "He wrote one prompt template with fixed sections: highlights, numbers reported by sites, challenges, next month.",
        "Placeholders mark what changes each month, such as the site reports and the period.",
        "He added a rule: only figures that appear in the site reports may be used.",
      ],
      fr: [
        "Il a écrit un modèle de prompt avec des sections fixes : faits marquants, chiffres transmis par les sites, difficultés, mois suivant.",
        "Des repères indiquent ce qui change chaque mois, comme les rapports des sites et la période.",
        "Il a ajouté une règle : seuls les chiffres présents dans les rapports des sites peuvent être utilisés.",
      ],
      sw: [
        "Aliandika kiolezo kimoja cha prompt chenye sehemu zisizobadilika: mambo muhimu, takwimu zilizoripotiwa na maeneo, changamoto, mwezi ujao.",
        "Alama zinaonyesha kinachobadilika kila mwezi, kama ripoti za maeneo na kipindi.",
        "Aliongeza kanuni: takwimu zinazoonekana kwenye ripoti za maeneo pekee ndizo zinaweza kutumika.",
      ],
    },
    result: {
      en: "In this scenario, every update has the same shape, so donors can compare months easily. Writing the update becomes a review task instead of a blank page.",
      fr: "Dans ce scénario, chaque point a la même forme, et les bailleurs comparent facilement les mois. Rédiger le point devient une relecture plutôt qu’une page blanche.",
      sw: "Katika mfano huu, kila taarifa ina muundo ule ule, hivyo wafadhili wanalinganisha miezi kwa urahisi. Kuandika taarifa kunakuwa kazi ya kukagua badala ya ukurasa mtupu.",
    },
    skills: {
      en: "Reusable prompt templates, placeholders, grounding numbers in sources.",
      fr: "Modèles de prompts réutilisables, repères à remplir, chiffres ancrés dans les sources.",
      sw: "Violezo vya prompt vinavyotumika tena, alama za kujaza, takwimu zinazotokana na vyanzo.",
    },
    labSlug: "ai-forward-lab-3-reusable-prompt-template",
  },

  // ── AI Governance, Risk and Compliance ───────────────────────────────────
  {
    id: "nairobi-lender-impact-assessment",
    trackSlug: "ai-governance",
    title: {
      en: "A digital lender assesses the impact of AI credit scoring",
      fr: "Un prêteur numérique évalue l’impact de la notation de crédit par IA",
      sw: "Mkopeshaji wa kidijitali anatathmini athari za AI katika kupima mikopo",
    },
    place: { en: "Nairobi, Kenya", fr: "Nairobi, Kenya", sw: "Nairobi, Kenya" },
    sector: { en: "Financial services", fr: "Services financiers", sw: "Huduma za fedha" },
    situation: {
      en: "A mobile lending start-up planned to use a model to decide small loan limits. The product team was ready to launch. The compliance officer asked who could be harmed if the model was wrong, and how a customer could challenge a decision.",
      fr: "Une jeune entreprise de prêt mobile prévoyait d’utiliser un modèle pour fixer les plafonds de petits prêts. L’équipe produit était prête à lancer. La responsable conformité a demandé qui pourrait être lésé si le modèle se trompait, et comment un client pourrait contester une décision.",
      sw: "Kampuni changa ya mikopo kwa simu ilipanga kutumia modeli kuamua viwango vya mikopo midogo. Timu ya bidhaa ilikuwa tayari kuzindua. Afisa wa uzingatiaji aliuliza nani anaweza kuathirika modeli ikikosea, na mteja anawezaje kupinga uamuzi.",
    },
    steps: {
      en: [
        "The team added the use case to an AI register with its owner, data sources and risk level.",
        "They ran an impact assessment: affected groups, possible unfair outcomes, data protection duties.",
        "They added a human review path for declined applicants and a plain-language explanation of the main factors.",
      ],
      fr: [
        "L’équipe a inscrit le cas d’usage dans un registre IA avec son responsable, ses sources de données et son niveau de risque.",
        "Elle a mené une évaluation d’impact : groupes concernés, résultats injustes possibles, obligations de protection des données.",
        "Elle a ajouté un recours humain pour les demandes refusées et une explication simple des principaux facteurs.",
      ],
      sw: [
        "Timu iliongeza matumizi haya kwenye rejista ya AI pamoja na mmiliki wake, vyanzo vya data na kiwango cha hatari.",
        "Walifanya tathmini ya athari: makundi yanayoguswa, matokeo yasiyo ya haki yanayowezekana, wajibu wa kulinda data.",
        "Waliongeza njia ya ukaguzi wa binadamu kwa waombaji waliokataliwa na maelezo rahisi ya sababu kuu.",
      ],
    },
    result: {
      en: "In this scenario, the product launches a little later but with clear accountability and a way to correct mistakes. The assessment also prepares the company for questions from regulators.",
      fr: "Dans ce scénario, le produit sort un peu plus tard mais avec une responsabilité claire et un moyen de corriger les erreurs. L’évaluation prépare aussi l’entreprise aux questions des régulateurs.",
      sw: "Katika mfano huu, bidhaa inazinduliwa baadaye kidogo lakini ikiwa na uwajibikaji wazi na njia ya kurekebisha makosa. Tathmini pia inaiandaa kampuni kwa maswali kutoka kwa wadhibiti.",
    },
    skills: {
      en: "AI use-case register, impact assessment, fairness and contestability.",
      fr: "Registre des usages de l’IA, évaluation d’impact, équité et droit de contestation.",
      sw: "Rejista ya matumizi ya AI, tathmini ya athari, haki na uwezo wa kupinga uamuzi.",
    },
    labSlug: "ai-governance-lab-3-impact-assessment",
  },
  {
    id: "detroit-staffing-vendor-terms",
    trackSlug: "ai-governance",
    title: {
      en: "A staffing agency reads the fine print of an AI screening tool",
      fr: "Une agence d’intérim lit les petites lignes d’un outil de tri par IA",
      sw: "Wakala wa ajira anasoma masharti ya zana ya AI ya kuchuja",
    },
    place: { en: "Detroit, USA", fr: "Detroit, États-Unis", sw: "Detroit, Marekani" },
    sector: { en: "Recruitment", fr: "Recrutement", sw: "Uajiri" },
    situation: {
      en: "A staffing agency was offered an AI tool that ranks job applicants. The sales demo was impressive and the price was low. Before signing, the operations director asked to review the contract and the vendor's data terms.",
      fr: "Une agence d’intérim s’est vu proposer un outil d’IA qui classe les candidats. La démonstration commerciale était impressionnante et le prix bas. Avant de signer, le directeur des opérations a demandé à examiner le contrat et les conditions sur les données.",
      sw: "Wakala wa ajira alipewa zana ya AI inayopanga waombaji wa kazi kwa daraja. Onyesho la mauzo lilivutia na bei ilikuwa nafuu. Kabla ya kusaini, mkurugenzi wa uendeshaji aliomba kukagua mkataba na masharti ya data ya muuzaji.",
    },
    steps: {
      en: [
        "The team checked who owns applicant data, whether the vendor may train its models on it, and how long it is kept.",
        "They asked for evidence of bias testing and how the ranking can be explained to a candidate.",
        "They negotiated changes, including the right to audit and to delete data when the contract ends.",
      ],
      fr: [
        "L’équipe a vérifié à qui appartiennent les données des candidats, si le fournisseur peut entraîner ses modèles avec, et combien de temps elles sont gardées.",
        "Elle a demandé des preuves de tests de biais et comment expliquer le classement à un candidat.",
        "Elle a négocié des changements, dont un droit d’audit et la suppression des données en fin de contrat.",
      ],
      sw: [
        "Timu ilikagua nani anamiliki data za waombaji, kama muuzaji anaweza kufunza modeli zake kwa data hizo, na zinahifadhiwa kwa muda gani.",
        "Waliomba ushahidi wa majaribio ya upendeleo na jinsi upangaji unavyoweza kuelezwa kwa mwombaji.",
        "Walijadiliana mabadiliko, ikiwemo haki ya ukaguzi na kufuta data mkataba ukiisha.",
      ],
    },
    result: {
      en: "In this scenario, the agency signs a contract that protects candidates and itself, or walks away with clear reasons. Reading the terms becomes a standard step for every AI purchase.",
      fr: "Dans ce scénario, l’agence signe un contrat qui protège les candidats et elle-même, ou renonce avec des raisons claires. Lire les conditions devient une étape normale de tout achat d’IA.",
      sw: "Katika mfano huu, wakala anasaini mkataba unaowalinda waombaji na yeye mwenyewe, au anaacha kwa sababu wazi. Kusoma masharti kunakuwa hatua ya kawaida kwa kila ununuzi wa AI.",
    },
    skills: {
      en: "Vendor due diligence, data terms, bias and explainability questions.",
      fr: "Vérification des fournisseurs, conditions sur les données, questions de biais et d’explicabilité.",
      sw: "Uchunguzi wa wauzaji, masharti ya data, maswali ya upendeleo na ufafanuzi.",
    },
    labSlug: "ai-governance-lab-5-critique-vendor-terms",
  },
  {
    id: "casablanca-callcentre-incident",
    trackSlug: "ai-governance",
    title: {
      en: "A call centre handles a chatbot that gave the wrong refund policy",
      fr: "Un centre d’appels gère un chatbot qui a donné la mauvaise politique de remboursement",
      sw: "Kituo cha simu kinashughulikia chatbot iliyotoa sera mbaya ya kurejesha pesa",
    },
    place: { en: "Casablanca, Morocco", fr: "Casablanca, Maroc", sw: "Casablanca, Moroko" },
    sector: { en: "Customer service", fr: "Service client", sw: "Huduma kwa wateja" },
    situation: {
      en: "An outsourced call centre runs a chat assistant for an electronics retailer. For two days, the assistant told customers they had 60 days to return items, while the real policy was 14. Complaints started arriving, and nobody knew who should act.",
      fr: "Un centre d’appels externalisé gère un assistant de discussion pour un vendeur d’électronique. Pendant deux jours, l’assistant a dit aux clients qu’ils avaient 60 jours pour retourner un article, alors que la vraie règle était de 14. Les plaintes ont commencé à arriver, et personne ne savait qui devait agir.",
      sw: "Kituo cha simu cha nje kinaendesha msaidizi wa gumzo kwa muuzaji wa vifaa vya elektroniki. Kwa siku mbili, msaidizi aliwaambia wateja walikuwa na siku 60 za kurudisha bidhaa, wakati sera halisi ilikuwa siku 14. Malalamiko yalianza kufika, na hakuna aliyejua nani anapaswa kuchukua hatua.",
    },
    steps: {
      en: [
        "They wrote an incident playbook: who can switch the assistant off, who informs the client company, who contacts affected customers.",
        "They traced the cause: an old policy document was still in the assistant's knowledge base.",
        "They added a review step whenever policy documents change, and a quarterly drill.",
      ],
      fr: [
        "Ils ont écrit un plan de gestion d’incident : qui peut couper l’assistant, qui prévient l’entreprise cliente, qui contacte les clients concernés.",
        "Ils ont trouvé la cause : un ancien document de politique était encore dans la base de connaissances de l’assistant.",
        "Ils ont ajouté une vérification à chaque changement de document de politique, et un exercice chaque trimestre.",
      ],
      sw: [
        "Waliandika mwongozo wa matukio: nani anaweza kuzima msaidizi, nani anaarifu kampuni mteja, nani anawasiliana na wateja walioathirika.",
        "Walifuatilia chanzo: hati ya sera ya zamani ilikuwa bado kwenye hifadhi ya maarifa ya msaidizi.",
        "Waliongeza hatua ya ukaguzi kila hati za sera zinapobadilika, na zoezi kila robo mwaka.",
      ],
    },
    result: {
      en: "In this scenario, the next incident is handled in hours, not days, with clear roles and honest messages to customers. The root cause is fixed, not just the symptom.",
      fr: "Dans ce scénario, l’incident suivant est réglé en quelques heures et non en jours, avec des rôles clairs et des messages honnêtes aux clients. La cause profonde est corrigée, pas seulement le symptôme.",
      sw: "Katika mfano huu, tukio linalofuata linashughulikiwa kwa saa, si siku, kwa majukumu wazi na ujumbe wa kweli kwa wateja. Chanzo halisi kinarekebishwa, si dalili tu.",
    },
    skills: {
      en: "Incident response, accountability, keeping knowledge sources current.",
      fr: "Réponse aux incidents, responsabilité, tenir les sources de connaissance à jour.",
      sw: "Kukabiliana na matukio, uwajibikaji, kuweka vyanzo vya maarifa vikiwa vipya.",
    },
    labSlug: "ai-governance-lab-4-incident-playbook",
  },

  // ── AI and Machine Learning Fundamentals ─────────────────────────────────
  {
    id: "kumasi-distributor-frame-problem",
    trackSlug: "ai-ml-fundamentals",
    title: {
      en: "A farm-input distributor frames a forecasting problem",
      fr: "Un distributeur d’intrants agricoles cadre un problème de prévision",
      sw: "Msambazaji wa pembejeo za kilimo anafafanua tatizo la utabiri",
    },
    place: { en: "Kumasi, Ghana", fr: "Kumasi, Ghana", sw: "Kumasi, Ghana" },
    sector: { en: "Agriculture", fr: "Agriculture", sw: "Kilimo" },
    situation: {
      en: "A distributor of seeds and fertiliser often runs out of popular products at planting time and is left with unsold stock afterwards. The owner heard that machine learning can \"predict demand\". A consultant offered to build a model, but nobody had defined what exactly should be predicted.",
      fr: "Un distributeur de semences et d’engrais manque souvent des produits les plus demandés au moment des semis et garde ensuite des invendus. Le propriétaire a entendu que l’apprentissage automatique peut « prédire la demande ». Un consultant a proposé un modèle, mais personne n’avait défini ce qu’il fallait prédire exactement.",
      sw: "Msambazaji wa mbegu na mbolea mara nyingi huishiwa na bidhaa zinazopendwa wakati wa kupanda na hubaki na bidhaa zisizouzwa baadaye. Mmiliki alisikia kwamba machine learning inaweza \"kutabiri mahitaji\". Mshauri alijitolea kujenga modeli, lakini hakuna aliyefafanua hasa nini kinapaswa kutabiriwa.",
    },
    steps: {
      en: [
        "They framed the question: weekly sales per product per branch, four weeks ahead.",
        "They checked the data they really had: three seasons of sales records, with gaps in one branch.",
        "They agreed how to judge success against today's method (the manager's estimate) before any model was built.",
      ],
      fr: [
        "Ils ont cadré la question : ventes hebdomadaires par produit et par agence, quatre semaines à l’avance.",
        "Ils ont vérifié les données réellement disponibles : trois saisons de ventes, avec des trous pour une agence.",
        "Ils ont convenu de comment juger le succès face à la méthode actuelle (l’estimation du gérant) avant de construire un modèle.",
      ],
      sw: [
        "Walifafanua swali: mauzo ya kila wiki kwa kila bidhaa kwa kila tawi, wiki nne mbele.",
        "Walikagua data waliyokuwa nayo kweli: misimu mitatu ya rekodi za mauzo, yenye mapengo kwenye tawi moja.",
        "Walikubaliana jinsi ya kupima mafanikio dhidi ya njia ya sasa (makadirio ya meneja) kabla ya kujenga modeli yoyote.",
      ],
    },
    result: {
      en: "In this scenario, the project starts with a clear, testable goal and a fair baseline. If the model cannot beat the manager's estimate, the owner will know before paying for more.",
      fr: "Dans ce scénario, le projet démarre avec un objectif clair et testable et une base de comparaison juste. Si le modèle ne bat pas l’estimation du gérant, le propriétaire le saura avant de payer davantage.",
      sw: "Katika mfano huu, mradi unaanza na lengo wazi linaloweza kupimwa na kipimo cha kulinganisha cha haki. Modeli isipozidi makadirio ya meneja, mmiliki atajua kabla ya kulipa zaidi.",
    },
    skills: {
      en: "Framing an ML problem, data readiness, baselines and success measures.",
      fr: "Cadrer un problème de ML, état des données, référence de base et critères de succès.",
      sw: "Kufafanua tatizo la ML, utayari wa data, vipimo vya msingi na vigezo vya mafanikio.",
    },
    labSlug: "ml-fundamentals-lab-1-frame-the-problem",
  },
  {
    id: "houston-clinics-no-show-vendor",
    trackSlug: "ai-ml-fundamentals",
    title: {
      en: "A clinic network questions a vendor's no-show prediction pitch",
      fr: "Un réseau de cliniques interroge l’offre d’un fournisseur de prédiction des absences",
      sw: "Mtandao wa kliniki unahoji ofa ya muuzaji ya kutabiri wagonjwa wasiofika",
    },
    place: { en: "Houston, USA", fr: "Houston, États-Unis", sw: "Houston, Marekani" },
    sector: { en: "Health care", fr: "Santé", sw: "Afya" },
    situation: {
      en: "A network of community clinics loses many appointment slots to patients who do not show up. A vendor pitched a model that \"predicts no-shows with high accuracy\". The operations lead was not sure what that claim meant or whether it would hold for their patients.",
      fr: "Un réseau de centres de santé communautaires perd beaucoup de créneaux à cause de patients qui ne viennent pas. Un fournisseur a présenté un modèle qui « prédit les absences avec une grande précision ». La responsable des opérations ne savait pas bien ce que voulait dire cette promesse ni si elle tiendrait pour leurs patients.",
      sw: "Mtandao wa kliniki za jamii hupoteza nafasi nyingi za miadi kwa wagonjwa wasiofika. Muuzaji aliwasilisha modeli \"inayotabiri wasiofika kwa usahihi mkubwa\". Kiongozi wa uendeshaji hakuwa na uhakika dai hilo lilimaanisha nini au kama lingefaa kwa wagonjwa wao.",
    },
    steps: {
      en: [
        "She asked what \"accuracy\" was measured on, and found that most patients do show up, so a model that always says \"will come\" also scores high.",
        "She asked for precision and recall on the no-show group and for results on data like theirs.",
        "She asked what the clinics would do with a prediction, and ruled out using it to refuse care.",
      ],
      fr: [
        "Elle a demandé sur quoi la « précision » était mesurée, et a vu que la plupart des patients viennent, donc qu’un modèle qui dit toujours « viendra » obtient aussi un bon score.",
        "Elle a demandé la précision et le rappel sur le groupe des absents, et des résultats sur des données proches des leurs.",
        "Elle a demandé ce que les cliniques feraient d’une prédiction, et a exclu de s’en servir pour refuser des soins.",
      ],
      sw: [
        "Aliuliza \"usahihi\" ulipimwa kwa nini, na akagundua kwamba wagonjwa wengi hufika, hivyo modeli inayosema kila mara \"atakuja\" pia hupata alama za juu.",
        "Aliomba precision na recall kwa kundi la wasiofika na matokeo kwenye data inayofanana na yao.",
        "Aliuliza kliniki zingefanya nini na utabiri, na akakataa kuutumia kunyima huduma.",
      ],
    },
    result: {
      en: "In this scenario, the clinics ask for a pilot measured on their own data and plan to use predictions only for friendly reminder calls. The vendor's headline number no longer drives the decision.",
      fr: "Dans ce scénario, les cliniques demandent un pilote mesuré sur leurs propres données et prévoient d’utiliser les prédictions seulement pour des appels de rappel bienveillants. Le chiffre vedette du fournisseur ne décide plus à leur place.",
      sw: "Katika mfano huu, kliniki zinaomba majaribio yanayopimwa kwa data zao wenyewe na zinapanga kutumia utabiri kwa simu za ukumbusho za kirafiki tu. Takwimu kuu ya muuzaji haiamui tena kwa niaba yao.",
    },
    skills: {
      en: "Reading model metrics, class imbalance, precision and recall, questioning vendor claims.",
      fr: "Lire les métriques d’un modèle, déséquilibre des classes, précision et rappel, questionner les promesses des fournisseurs.",
      sw: "Kusoma vipimo vya modeli, kutolingana kwa makundi, precision na recall, kuhoji madai ya wauzaji.",
    },
    labSlug: "ml-fundamentals-lab-2-vendor-pitch",
  },
  {
    id: "dar-bank-fraud-evaluation",
    trackSlug: "ai-ml-fundamentals",
    title: {
      en: "A bank evaluates a fraud model that blocks good customers",
      fr: "Une banque évalue un modèle anti-fraude qui bloque de bons clients",
      sw: "Benki inatathmini modeli ya udanganyifu inayozuia wateja wazuri",
    },
    place: { en: "Dar es Salaam, Tanzania", fr: "Dar es Salaam, Tanzanie", sw: "Dar es Salaam, Tanzania" },
    sector: { en: "Banking", fr: "Banque", sw: "Benki" },
    situation: {
      en: "A regional bank introduced a model that flags suspicious mobile money transfers. Fraud losses fell, but the call centre filled with honest customers whose payments were blocked, often small traders paying suppliers. Managers argued about whether the model was \"working\".",
      fr: "Une banque régionale a mis en place un modèle qui signale les transferts d’argent mobile suspects. Les pertes dues à la fraude ont baissé, mais le centre d’appels s’est rempli de clients honnêtes dont les paiements étaient bloqués, souvent de petits commerçants qui payaient leurs fournisseurs. Les responsables se disputaient pour savoir si le modèle « marchait ».",
      sw: "Benki ya kikanda ilianzisha modeli inayoweka alama kwenye uhamisho wa pesa kwa simu unaotiliwa shaka. Hasara za udanganyifu zilipungua, lakini kituo cha simu kilijaa wateja waaminifu ambao malipo yao yalizuiwa, mara nyingi wafanyabiashara wadogo wanaolipa wasambazaji. Mameneja walibishana kama modeli \"inafanya kazi\".",
    },
    steps: {
      en: [
        "The analytics team wrote an evaluation report covering both kinds of error: fraud missed and good payments blocked.",
        "They broke results down by customer group and found small traders were blocked far more often.",
        "They proposed a different threshold for known regular payees, plus a fast unblock by SMS.",
      ],
      fr: [
        "L’équipe d’analyse a rédigé un rapport d’évaluation couvrant les deux types d’erreur : fraudes manquées et bons paiements bloqués.",
        "Elle a détaillé les résultats par groupe de clients et vu que les petits commerçants étaient bien plus souvent bloqués.",
        "Elle a proposé un seuil différent pour les bénéficiaires réguliers connus, et un déblocage rapide par SMS.",
      ],
      sw: [
        "Timu ya uchambuzi iliandika ripoti ya tathmini inayohusu aina zote mbili za makosa: udanganyifu uliokosekana na malipo mazuri yaliyozuiwa.",
        "Walichambua matokeo kwa makundi ya wateja na kugundua wafanyabiashara wadogo walizuiwa mara nyingi zaidi.",
        "Walipendekeza kiwango tofauti kwa wapokeaji wa kawaida wanaojulikana, pamoja na kufungua haraka kwa SMS.",
      ],
    },
    result: {
      en: "In this scenario, the debate moves from \"is it working?\" to a clear trade-off that managers can choose. Small traders stop being the hidden cost of fraud protection.",
      fr: "Dans ce scénario, le débat passe de « est-ce que ça marche ? » à un arbitrage clair que les responsables peuvent trancher. Les petits commerçants cessent d’être le coût caché de la lutte contre la fraude.",
      sw: "Katika mfano huu, mjadala unahama kutoka \"inafanya kazi?\" hadi uchaguzi wazi ambao mameneja wanaweza kuufanya. Wafanyabiashara wadogo wanaacha kuwa gharama iliyofichwa ya kujikinga na udanganyifu.",
    },
    skills: {
      en: "Evaluation reports, false positives and false negatives, thresholds, fairness across groups.",
      fr: "Rapports d’évaluation, faux positifs et faux négatifs, seuils, équité entre groupes.",
      sw: "Ripoti za tathmini, makosa chanya na hasi, viwango vya maamuzi, haki kati ya makundi.",
    },
    labSlug: "ml-fundamentals-lab-3-evaluation-report",
  },

  // ── AI for Parents ───────────────────────────────────────────────────────
  {
    id: "nairobi-school-family-agreement",
    trackSlug: "ai-for-parents",
    title: {
      en: "A school and its parents agree on home AI rules",
      fr: "Une école et ses parents s’accordent sur des règles d’IA à la maison",
      sw: "Shule na wazazi wanakubaliana kanuni za AI nyumbani",
    },
    place: { en: "Nairobi, Kenya", fr: "Nairobi, Kenya", sw: "Nairobi, Kenya" },
    sector: { en: "Education and family", fr: "Éducation et famille", sw: "Elimu na familia" },
    situation: {
      en: "A primary school noticed homework that was clearly written by chatbots. Some parents banned AI completely; others let children use it freely. Teachers and families had no shared language for what was helpful and what was cheating.",
      fr: "Une école primaire a remarqué des devoirs clairement écrits par des chatbots. Certains parents ont interdit l’IA, d’autres laissaient les enfants l’utiliser librement. Enseignants et familles n’avaient pas de langage commun sur ce qui aide et ce qui est de la triche.",
      sw: "Shule ya msingi iligundua kazi za nyumbani zilizoandikwa wazi na chatbot. Baadhi ya wazazi walipiga marufuku AI kabisa; wengine waliwaacha watoto waitumie bila kikomo. Walimu na familia hawakuwa na lugha ya pamoja kuhusu kinachosaidia na kilicho udanganyifu.",
    },
    steps: {
      en: [
        "At a parents' evening, families listed how their children already use AI at home.",
        "Each family drafted a short agreement: when AI is allowed, for what, and when to show a parent the conversation.",
        "Teachers added one classroom rule: say when and how you used AI.",
      ],
      fr: [
        "Lors d’une réunion de parents, les familles ont listé comment leurs enfants utilisent déjà l’IA à la maison.",
        "Chaque famille a rédigé un court accord : quand l’IA est permise, pour quoi faire, et quand montrer la conversation à un parent.",
        "Les enseignants ont ajouté une règle en classe : dire quand et comment on a utilisé l’IA.",
      ],
      sw: [
        "Katika kikao cha wazazi, familia ziliorodhesha jinsi watoto wao tayari wanavyotumia AI nyumbani.",
        "Kila familia iliandaa makubaliano mafupi: AI inaruhusiwa lini, kwa nini, na lini kumwonyesha mzazi mazungumzo.",
        "Walimu waliongeza kanuni moja darasani: sema ni lini na jinsi gani ulitumia AI.",
      ],
    },
    result: {
      en: "In this scenario, children get consistent messages at home and at school, and honest use of AI becomes normal to talk about. Parents feel less alone with the question.",
      fr: "Dans ce scénario, les enfants reçoivent le même message à la maison et à l’école, et parler honnêtement de son usage de l’IA devient normal. Les parents se sentent moins seuls face à la question.",
      sw: "Katika mfano huu, watoto wanapata ujumbe unaolingana nyumbani na shuleni, na kuzungumza kwa uwazi kuhusu matumizi ya AI kunakuwa kawaida. Wazazi wanajihisi si wapweke tena na swali hili.",
    },
    skills: {
      en: "Family AI agreements, open conversations about AI, honest use for homework.",
      fr: "Accords familiaux sur l’IA, parler ouvertement de l’IA, usage honnête pour les devoirs.",
      sw: "Makubaliano ya familia kuhusu AI, mazungumzo ya wazi kuhusu AI, matumizi ya uaminifu kwa kazi za nyumbani.",
    },
    labSlug: "ai-for-parents-lab-6-family-ai-agreement",
  },
  {
    id: "atlanta-parent-unsafe-reply",
    trackSlug: "ai-for-parents",
    title: {
      en: "A parent spots an unsafe chatbot reply and acts calmly",
      fr: "Un parent repère une réponse dangereuse d’un chatbot et réagit calmement",
      sw: "Mzazi anagundua jibu hatari la chatbot na anachukua hatua kwa utulivu",
    },
    place: { en: "Atlanta, USA", fr: "Atlanta, États-Unis", sw: "Atlanta, Marekani" },
    sector: { en: "Family", fr: "Famille", sw: "Familia" },
    situation: {
      en: "A father found that his 13-year-old had been chatting late at night with a companion app. One reply encouraged her to keep a secret from her parents and skip meals to \"feel lighter\". His first instinct was to take the phone away for good.",
      fr: "Un père a découvert que sa fille de 13 ans discutait tard le soir avec une application de compagnon virtuel. Une réponse l’encourageait à garder un secret envers ses parents et à sauter des repas pour « se sentir plus légère ». Son premier réflexe a été de lui confisquer le téléphone pour de bon.",
      sw: "Baba aligundua kwamba binti yake wa miaka 13 alikuwa akizungumza usiku na programu ya rafiki wa kidijitali. Jibu moja lilimhimiza aweke siri kwa wazazi wake na aache kula ili \"ajisikie mwepesi\". Silika yake ya kwanza ilikuwa kuchukua simu kabisa.",
    },
    steps: {
      en: [
        "He used a simple checklist to name what was unsafe: secrecy, health advice, emotional dependence.",
        "He talked with his daughter without blame, and they looked at the replies together.",
        "They reported the app, switched to safer settings, and agreed she would tell him if a chat ever felt wrong.",
      ],
      fr: [
        "Il a utilisé une liste simple pour nommer ce qui était dangereux : le secret, des conseils de santé, la dépendance affective.",
        "Il a parlé avec sa fille sans reproche, et ils ont regardé les réponses ensemble.",
        "Ils ont signalé l’application, choisi des réglages plus sûrs, et convenu qu’elle lui dirait si une conversation lui semblait anormale.",
      ],
      sw: [
        "Alitumia orodha rahisi kutaja kilichokuwa hatari: usiri, ushauri wa afya, utegemezi wa kihisia.",
        "Alizungumza na binti yake bila lawama, na waliangalia majibu pamoja.",
        "Waliripoti programu, wakabadilisha mipangilio iwe salama zaidi, na wakakubaliana atamwambia mazungumzo yoyote yakihisi si sawa.",
      ],
    },
    result: {
      en: "In this scenario, the daughter stays safe and keeps trusting her father enough to come back to him. Where there are signs of an eating problem, the family also talks to their doctor.",
      fr: "Dans ce scénario, la fille est protégée et garde assez confiance en son père pour revenir vers lui. Face à des signes de trouble alimentaire, la famille en parle aussi à son médecin.",
      sw: "Katika mfano huu, binti anabaki salama na anaendelea kumwamini baba yake vya kutosha kurudi kwake. Kukiwa na dalili za tatizo la ulaji, familia pia inazungumza na daktari wao.",
    },
    skills: {
      en: "Recognising unsafe AI replies, calm conversations, family safety settings.",
      fr: "Reconnaître une réponse d’IA dangereuse, des conversations calmes, les réglages de sécurité familiale.",
      sw: "Kutambua majibu hatari ya AI, mazungumzo ya utulivu, mipangilio ya usalama ya familia.",
    },
    labSlug: "ai-for-parents-lab-4-spot-the-unsafe-chatbot-reply",
  },
  {
    id: "ouagadougou-socratic-tutor",
    trackSlug: "ai-for-parents",
    title: {
      en: "A mother turns a chatbot into a tutor that asks questions",
      fr: "Une mère transforme un chatbot en tuteur qui pose des questions",
      sw: "Mama anageuza chatbot kuwa mwalimu anayeuliza maswali",
    },
    place: { en: "Ouagadougou, Burkina Faso", fr: "Ouagadougou, Burkina Faso", sw: "Ouagadougou, Burkina Faso" },
    sector: { en: "Family learning", fr: "Apprentissage en famille", sw: "Kujifunza kifamilia" },
    situation: {
      en: "A mother who runs a small shop has little time in the evening to help her son with maths. He started asking a chatbot for the answers and copying them. His marks in class tests dropped, because he had not learned the methods.",
      fr: "Une mère qui tient une petite boutique a peu de temps le soir pour aider son fils en maths. Il a commencé à demander les réponses à un chatbot et à les recopier. Ses notes aux contrôles ont baissé, car il n’avait pas appris les méthodes.",
      sw: "Mama anayeendesha duka dogo ana muda mchache jioni kumsaidia mwanawe hesabu. Mtoto alianza kuiuliza chatbot majibu na kuyanakili. Alama zake kwenye majaribio darasani zilishuka, kwa sababu hakuwa amejifunza mbinu.",
    },
    steps: {
      en: [
        "She wrote a short tutor prompt with her son: never give the final answer, ask one question at a time, give a hint after two tries.",
        "They saved it so he starts every homework session with it.",
        "Once a week, he explains one solved problem to her in his own words.",
      ],
      fr: [
        "Elle a écrit avec son fils un court prompt de tuteur : ne jamais donner la réponse finale, poser une question à la fois, donner un indice après deux essais.",
        "Ils l’ont enregistré pour qu’il commence chaque séance de devoirs avec.",
        "Une fois par semaine, il lui explique un exercice résolu avec ses propres mots.",
      ],
      sw: [
        "Aliandika pamoja na mwanawe prompt fupi ya mwalimu: kamwe usitoe jibu la mwisho, uliza swali moja kwa wakati, toa kidokezo baada ya majaribio mawili.",
        "Waliihifadhi ili aanze kila kipindi cha kazi ya nyumbani nayo.",
        "Mara moja kwa wiki, anamweleza tatizo moja alilotatua kwa maneno yake mwenyewe.",
      ],
    },
    result: {
      en: "In this scenario, the boy does the thinking himself and the chatbot becomes a patient coach. His mother stays involved in a few minutes a week.",
      fr: "Dans ce scénario, le garçon réfléchit lui-même et le chatbot devient un coach patient. Sa mère reste impliquée en quelques minutes par semaine.",
      sw: "Katika mfano huu, mvulana anafikiri mwenyewe na chatbot inakuwa kocha mvumilivu. Mama yake anabaki akihusika kwa dakika chache kwa wiki.",
    },
    skills: {
      en: "Socratic tutor prompts, learning instead of copying, light parent involvement.",
      fr: "Prompts de tuteur socratique, apprendre au lieu de copier, un suivi parental léger.",
      sw: "Prompt za mwalimu wa kuuliza maswali, kujifunza badala ya kunakili, ushiriki mwepesi wa mzazi.",
    },
    labSlug: "ai-for-parents-lab-2-socratic-tutor-prompt",
  },

  // ── Practical Prompt Engineering ─────────────────────────────────────────
  {
    id: "cotonou-agency-prompt-library",
    trackSlug: "practical-prompt-engineering",
    title: {
      en: "A marketing agency builds a shared prompt library",
      fr: "Une agence marketing construit une bibliothèque de prompts partagée",
      sw: "Wakala wa masoko unajenga maktaba ya pamoja ya prompt",
    },
    place: { en: "Cotonou, Benin", fr: "Cotonou, Bénin", sw: "Cotonou, Benin" },
    sector: { en: "Marketing", fr: "Marketing", sw: "Masoko" },
    situation: {
      en: "A small marketing agency writes social posts and campaign ideas for local brands. Each staff member had their own favourite prompts saved in personal notes. When someone was away, nobody could reproduce their results.",
      fr: "Une petite agence marketing rédige des publications et des idées de campagne pour des marques locales. Chaque employé gardait ses prompts préférés dans ses notes personnelles. Quand quelqu’un était absent, personne ne pouvait reproduire ses résultats.",
      sw: "Wakala mdogo wa masoko huandika machapisho ya mitandao na mawazo ya kampeni kwa chapa za ndani. Kila mfanyakazi alihifadhi prompt zake anazopenda kwenye maelezo binafsi. Mtu akiwa hayupo, hakuna aliyeweza kuzalisha matokeo yake.",
    },
    steps: {
      en: [
        "The team collected their best prompts and rewrote each with a clear purpose, inputs to fill in and an example output.",
        "Each prompt got a short test: three sample briefs it must handle well.",
        "The library lives in one shared document with an owner who reviews changes.",
      ],
      fr: [
        "L’équipe a rassemblé ses meilleurs prompts et réécrit chacun avec un objectif clair, les éléments à remplir et un exemple de résultat.",
        "Chaque prompt a reçu un petit test : trois briefs types qu’il doit bien traiter.",
        "La bibliothèque est dans un document partagé, avec un responsable qui relit les changements.",
      ],
      sw: [
        "Timu ilikusanya prompt zao bora na kuandika upya kila moja kwa lengo wazi, taarifa za kujaza na mfano wa matokeo.",
        "Kila prompt ilipata jaribio fupi: maelezo matatu ya mfano inayopaswa kuyashughulikia vizuri.",
        "Maktaba iko kwenye hati moja ya pamoja yenye mmiliki anayekagua mabadiliko.",
      ],
    },
    result: {
      en: "In this scenario, new staff produce on-brand work in their first week, and quality no longer depends on who is in the office. Good prompts become team assets.",
      fr: "Dans ce scénario, les nouveaux produisent un travail fidèle aux marques dès la première semaine, et la qualité ne dépend plus de qui est au bureau. Les bons prompts deviennent un bien de l’équipe.",
      sw: "Katika mfano huu, wafanyakazi wapya wanazalisha kazi inayolingana na chapa katika wiki yao ya kwanza, na ubora hautegemei tena nani yuko ofisini. Prompt nzuri zinakuwa mali ya timu.",
    },
    skills: {
      en: "Prompt libraries, templates with inputs, documenting and testing prompts.",
      fr: "Bibliothèques de prompts, modèles avec éléments à remplir, documenter et tester les prompts.",
      sw: "Maktaba za prompt, violezo vyenye taarifa za kujaza, kuandika na kujaribu prompt.",
    },
    labSlug: "prompt-specialist-lab-6-mini-prompt-library",
  },
  {
    id: "columbus-claims-test-set",
    trackSlug: "practical-prompt-engineering",
    title: {
      en: "A claims team tests a prompt before changing it",
      fr: "Une équipe sinistres teste un prompt avant de le modifier",
      sw: "Timu ya madai inajaribu prompt kabla ya kuibadilisha",
    },
    place: { en: "Columbus, USA", fr: "Columbus, États-Unis", sw: "Columbus, Marekani" },
    sector: { en: "Insurance", fr: "Assurance", sw: "Bima" },
    situation: {
      en: "A claims team uses a prompt to summarise long customer letters for adjusters. Every time someone \"improved\" the prompt, a different kind of letter started coming out wrong. Arguments about which version was better went nowhere.",
      fr: "Une équipe sinistres utilise un prompt pour résumer les longues lettres des clients à l’intention des experts. Chaque fois que quelqu’un « améliorait » le prompt, un autre type de lettre se mettait à mal sortir. Les débats sur la meilleure version ne menaient à rien.",
      sw: "Timu ya madai inatumia prompt kufupisha barua ndefu za wateja kwa ajili ya wakaguzi. Kila mara mtu \"alipoboresha\" prompt, aina nyingine ya barua ilianza kutoka vibaya. Mabishano kuhusu toleo bora hayakufika popote.",
    },
    steps: {
      en: [
        "They built a test set of twenty anonymised letters covering the usual and the difficult cases.",
        "They wrote a rubric: key facts present, no invented details, right length, urgent issues flagged.",
        "Any new version of the prompt must score at least as well on the whole set before it is used.",
      ],
      fr: [
        "Ils ont constitué un jeu de test de vingt lettres anonymisées couvrant les cas courants et difficiles.",
        "Ils ont écrit une grille : faits clés présents, aucun détail inventé, bonne longueur, urgences signalées.",
        "Toute nouvelle version du prompt doit obtenir au moins le même score sur l’ensemble avant d’être utilisée.",
      ],
      sw: [
        "Waliunda seti ya majaribio ya barua ishirini zisizo na majina zinazohusu kesi za kawaida na ngumu.",
        "Waliandika kigezo: taarifa muhimu zipo, hakuna maelezo yaliyobuniwa, urefu sahihi, masuala ya dharura yamewekwa alama.",
        "Toleo lolote jipya la prompt lazima lipate alama angalau sawa kwenye seti nzima kabla ya kutumika.",
      ],
    },
    result: {
      en: "In this scenario, changes are decided by results on the same letters, not by opinion. Improvements stick, and regressions are caught before adjusters see them.",
      fr: "Dans ce scénario, les changements se décident sur les résultats obtenus sur les mêmes lettres, pas sur des opinions. Les améliorations durent, et les régressions sont repérées avant que les experts ne les voient.",
      sw: "Katika mfano huu, mabadiliko yanaamuliwa kwa matokeo kwenye barua zile zile, si kwa maoni. Maboresho yanadumu, na kurudi nyuma kunagunduliwa kabla wakaguzi hawajaona.",
    },
    skills: {
      en: "Test sets, scoring rubrics, regression testing for prompts.",
      fr: "Jeux de test, grilles de notation, tests de non-régression pour les prompts.",
      sw: "Seti za majaribio, vigezo vya alama, majaribio ya kurudi nyuma kwa prompt.",
    },
    labSlug: "prompt-specialist-lab-4-test-set-and-rubric",
  },
  {
    id: "kigali-hotel-prompt-chain",
    trackSlug: "practical-prompt-engineering",
    title: {
      en: "A hotel breaks review analysis into a chain of prompts",
      fr: "Un hôtel découpe l’analyse des avis en une chaîne de prompts",
      sw: "Hoteli inagawa uchambuzi wa maoni kuwa mfululizo wa prompt",
    },
    place: { en: "Kigali, Rwanda", fr: "Kigali, Rwanda", sw: "Kigali, Rwanda" },
    sector: { en: "Hospitality", fr: "Hôtellerie", sw: "Ukarimu" },
    situation: {
      en: "A boutique hotel collects guest reviews from several booking sites, in English, French and Kinyarwanda. The manager asked an AI in one long prompt to \"analyse all reviews and suggest improvements\". The answer was generic and missed the complaints that kept coming back.",
      fr: "Un petit hôtel de charme recueille les avis de clients sur plusieurs sites de réservation, en anglais, français et kinyarwanda. Le gérant a demandé à une IA, en un seul long prompt, d’« analyser tous les avis et proposer des améliorations ». La réponse était générale et passait à côté des plaintes récurrentes.",
      sw: "Hoteli ndogo ya kifahari hukusanya maoni ya wageni kutoka tovuti kadhaa za kuhifadhi nafasi, kwa Kiingereza, Kifaransa na Kinyarwanda. Meneja aliiomba AI kwa prompt moja ndefu \"ichambue maoni yote na ipendekeze maboresho\". Jibu lilikuwa la jumla na lilikosa malalamiko yaliyokuwa yakijirudia.",
    },
    steps: {
      en: [
        "He split the job into steps: tag each review by topic and feeling, then count topics, then suggest fixes for the top three.",
        "Each step has its own short prompt, and its output is checked before the next step uses it.",
        "The final suggestions must quote the reviews they are based on.",
      ],
      fr: [
        "Il a découpé le travail en étapes : classer chaque avis par sujet et ressenti, puis compter les sujets, puis proposer des solutions pour les trois premiers.",
        "Chaque étape a son propre prompt court, et son résultat est vérifié avant que l’étape suivante ne l’utilise.",
        "Les suggestions finales doivent citer les avis sur lesquels elles s’appuient.",
      ],
      sw: [
        "Aligawa kazi kuwa hatua: kuweka lebo kwa kila maoni kwa mada na hisia, kisha kuhesabu mada, kisha kupendekeza suluhisho kwa mada tatu za juu.",
        "Kila hatua ina prompt yake fupi, na matokeo yake yanakaguliwa kabla hatua inayofuata haijayatumia.",
        "Mapendekezo ya mwisho lazima yanukuu maoni yanayoyategemea.",
      ],
    },
    result: {
      en: "In this scenario, the recurring complaints (slow breakfast service and noisy rooms near the road) stand out clearly, with guests' own words as evidence. The manager can act on specifics.",
      fr: "Dans ce scénario, les plaintes récurrentes (service du petit-déjeuner lent, chambres bruyantes côté route) ressortent clairement, avec les mots des clients comme preuve. Le gérant peut agir sur du concret.",
      sw: "Katika mfano huu, malalamiko yanayojirudia (huduma ya kifungua kinywa ya polepole na vyumba vyenye kelele karibu na barabara) yanaonekana wazi, kwa maneno ya wageni kama ushahidi. Meneja anaweza kuchukua hatua kwa mambo mahususi.",
    },
    skills: {
      en: "Breaking tasks into steps, prompt chaining, checking each step's output.",
      fr: "Découper une tâche en étapes, enchaîner les prompts, vérifier le résultat de chaque étape.",
      sw: "Kugawa kazi kuwa hatua, kuunganisha prompt, kukagua matokeo ya kila hatua.",
    },
    labSlug: "prompt-specialist-lab-2-map-and-chain",
  },

  // ── AI for Small Business Owners ─────────────────────────────────────────
  {
    id: "accra-salon-brand-voice",
    trackSlug: "ai-small-business",
    title: {
      en: "A hair salon plans a week of posts in its own voice",
      fr: "Un salon de coiffure planifie une semaine de publications avec sa propre voix",
      sw: "Saluni ya nywele inapanga machapisho ya wiki kwa sauti yake",
    },
    place: { en: "Accra, Ghana", fr: "Accra, Ghana", sw: "Accra, Ghana" },
    sector: { en: "Beauty", fr: "Beauté", sw: "Urembo" },
    situation: {
      en: "The owner of a busy hair salon knows social media brings clients but never finds time to post. When she tried AI, the posts sounded like an advert from a big chain, not like her salon. Her regular clients noticed.",
      fr: "La propriétaire d’un salon de coiffure très fréquenté sait que les réseaux sociaux amènent des clientes, mais ne trouve jamais le temps de publier. Quand elle a essayé l’IA, les publications ressemblaient à une pub de grande chaîne, pas à son salon. Ses habituées l’ont remarqué.",
      sw: "Mmiliki wa saluni ya nywele yenye shughuli nyingi anajua mitandao ya kijamii huleta wateja lakini hapati muda wa kuchapisha. Alipojaribu AI, machapisho yalisikika kama tangazo la mnyororo mkubwa, si kama saluni yake. Wateja wake wa kawaida waligundua.",
    },
    steps: {
      en: [
        "She wrote a short brand voice guide: warm, playful, local phrases she really uses, words she never uses.",
        "She pasted three of her own past posts as examples.",
        "Every Sunday she asks for a week of posts, then edits and schedules them in twenty minutes.",
      ],
      fr: [
        "Elle a écrit un court guide de ton : chaleureux, joueur, des expressions locales qu’elle emploie vraiment, des mots qu’elle n’utilise jamais.",
        "Elle a collé trois de ses anciennes publications comme exemples.",
        "Chaque dimanche, elle demande une semaine de publications, puis les corrige et les programme en vingt minutes.",
      ],
      sw: [
        "Aliandika mwongozo mfupi wa sauti ya chapa: ya joto, ya uchangamfu, misemo ya kienyeji anayoitumia kweli, maneno asiyoyatumia kamwe.",
        "Alibandika machapisho matatu yake ya zamani kama mifano.",
        "Kila Jumapili anaomba machapisho ya wiki, kisha anayahariri na kuyapanga kwa dakika ishirini.",
      ],
    },
    result: {
      en: "In this scenario, the salon posts regularly and still sounds like itself. The owner spends her Sunday evening on twenty minutes of editing instead of a week of guilt.",
      fr: "Dans ce scénario, le salon publie régulièrement tout en gardant sa voix. La propriétaire passe vingt minutes à corriger le dimanche soir au lieu d’une semaine de culpabilité.",
      sw: "Katika mfano huu, saluni inachapisha mara kwa mara na bado inasikika kama yenyewe. Mmiliki anatumia dakika ishirini za kuhariri Jumapili jioni badala ya wiki nzima ya majuto.",
    },
    skills: {
      en: "Brand voice guides, giving examples, planning content in batches.",
      fr: "Guides de ton de marque, donner des exemples, planifier le contenu par lots.",
      sw: "Miongozo ya sauti ya chapa, kutoa mifano, kupanga maudhui kwa makundi.",
    },
    labSlug: "ai-small-business-lab-2-brand-voice-week-of-posts",
  },
  {
    id: "baltimore-bakery-review-reply",
    trackSlug: "ai-small-business",
    title: {
      en: "A bakery replies to an angry review without making it worse",
      fr: "Une boulangerie répond à un avis furieux sans envenimer les choses",
      sw: "Duka la mikate linajibu maoni ya hasira bila kuzidisha tatizo",
    },
    place: { en: "Baltimore, USA", fr: "Baltimore, États-Unis", sw: "Baltimore, Marekani" },
    sector: { en: "Food and retail", fr: "Alimentation et commerce", sw: "Chakula na rejareja" },
    situation: {
      en: "A neighbourhood bakery received a harsh online review about a birthday cake that arrived damaged. The owner was upset and asked AI to write a reply. The first draft was polite but offered a full refund the bakery had not agreed to and blamed the delivery driver by name.",
      fr: "Une boulangerie de quartier a reçu un avis en ligne très dur sur un gâteau d’anniversaire livré abîmé. Le patron, contrarié, a demandé à l’IA d’écrire une réponse. Le premier jet était poli mais proposait un remboursement complet non décidé et accusait le livreur en le nommant.",
      sw: "Duka la mikate la mtaani lilipokea maoni makali mtandaoni kuhusu keki ya siku ya kuzaliwa iliyofika ikiwa imeharibika. Mmiliki alikasirika na akaiomba AI iandike jibu. Rasimu ya kwanza ilikuwa ya heshima lakini ilitoa marejesho kamili ambayo duka halikukubali na ilimlaumu dereva kwa jina.",
    },
    steps: {
      en: [
        "He reviewed the draft against a checklist: no promises not decided, no blaming staff publicly, no private details.",
        "He decided the offer himself (a replacement cake) and asked the AI to rewrite with that offer only.",
        "He invited the customer to continue the conversation by phone.",
      ],
      fr: [
        "Il a relu le brouillon avec une liste : aucune promesse non décidée, aucun reproche public au personnel, aucun détail privé.",
        "Il a décidé lui-même du geste (un gâteau de remplacement) et a demandé à l’IA de réécrire avec ce seul geste.",
        "Il a invité la cliente à poursuivre l’échange par téléphone.",
      ],
      sw: [
        "Alikagua rasimu kwa orodha: hakuna ahadi zisizoamuliwa, hakuna kumlaumu mfanyakazi hadharani, hakuna taarifa binafsi.",
        "Aliamua ofa mwenyewe (keki mbadala) na akaiomba AI iandike upya kwa ofa hiyo tu.",
        "Alimkaribisha mteja kuendeleza mazungumzo kwa simu.",
      ],
    },
    result: {
      en: "In this scenario, the public reply is calm and honest, and future readers see a business that fixes problems. The owner learns to treat AI drafts as suggestions to check, not answers to post.",
      fr: "Dans ce scénario, la réponse publique est calme et honnête, et les futurs lecteurs voient une entreprise qui règle les problèmes. Le patron apprend à traiter les brouillons de l’IA comme des suggestions à vérifier, pas des réponses à publier telles quelles.",
      sw: "Katika mfano huu, jibu la hadharani ni tulivu na la kweli, na wasomaji wa baadaye wanaona biashara inayotatua matatizo. Mmiliki anajifunza kuchukulia rasimu za AI kama mapendekezo ya kukagua, si majibu ya kuchapisha.",
    },
    skills: {
      en: "Critiquing AI drafts, customer replies, keeping decisions with the owner.",
      fr: "Critiquer les brouillons de l’IA, répondre aux clients, garder les décisions au patron.",
      sw: "Kukosoa rasimu za AI, kuwajibu wateja, kuacha maamuzi kwa mmiliki.",
    },
    labSlug: "ai-small-business-lab-3-critique-a-review-reply",
  },
  {
    id: "dakar-fabric-margins",
    trackSlug: "ai-small-business",
    title: {
      en: "A fabric shop works out which products really make money",
      fr: "Une boutique de tissus découvre quels produits rapportent vraiment",
      sw: "Duka la vitambaa linagundua bidhaa zipi zinaleta faida kweli",
    },
    place: { en: "Dakar, Senegal", fr: "Dakar, Sénégal", sw: "Dakar, Senegal" },
    sector: { en: "Retail", fr: "Commerce", sw: "Rejareja" },
    situation: {
      en: "A family fabric and tailoring shop sells wax prints, bazin and made-to-measure outfits. Sales were good, but there was rarely money left at the end of the month. The owner suspected some popular items were sold too cheaply but had never calculated it.",
      fr: "Une boutique familiale de tissus et de couture vend du wax, du bazin et des tenues sur mesure. Les ventes étaient bonnes, mais il restait rarement de l’argent en fin de mois. La propriétaire soupçonnait que certains articles populaires étaient vendus trop bon marché, sans l’avoir jamais calculé.",
      sw: "Duka la familia la vitambaa na ushonaji linauza vitenge vya wax, bazin na nguo za kushonwa kwa vipimo. Mauzo yalikuwa mazuri, lakini mara chache pesa ilibaki mwisho wa mwezi. Mmiliki alishuku kwamba baadhi ya bidhaa zinazopendwa ziliuzwa kwa bei nafuu mno lakini hakuwahi kuhesabu.",
    },
    steps: {
      en: [
        "She gave the AI her own purchase prices, tailoring time and selling prices, product by product, without customer names.",
        "She asked it to lay out the margin calculation step by step so she could check every line.",
        "She checked the totals herself with a calculator before changing any price.",
      ],
      fr: [
        "Elle a donné à l’IA ses prix d’achat, le temps de couture et ses prix de vente, produit par produit, sans nom de client.",
        "Elle lui a demandé de détailler le calcul des marges étape par étape pour pouvoir vérifier chaque ligne.",
        "Elle a vérifié les totaux elle-même à la calculatrice avant de changer un prix.",
      ],
      sw: [
        "Aliipa AI bei zake za kununua, muda wa kushona na bei za kuuza, bidhaa kwa bidhaa, bila majina ya wateja.",
        "Aliiomba ieleze hesabu ya faida hatua kwa hatua ili aweze kukagua kila mstari.",
        "Alikagua jumla mwenyewe kwa kikokotoo kabla ya kubadilisha bei yoyote.",
      ],
    },
    result: {
      en: "In this scenario, she finds that her most popular made-to-measure outfit barely covers the tailor's time, and adjusts its price with confidence. The numbers are hers; AI only organised them.",
      fr: "Dans ce scénario, elle découvre que sa tenue sur mesure la plus demandée couvre à peine le temps du tailleur, et ajuste son prix en confiance. Les chiffres sont les siens ; l’IA les a seulement organisés.",
      sw: "Katika mfano huu, anagundua kwamba nguo yake ya vipimo inayopendwa zaidi inafidia muda wa fundi kwa shida, na anarekebisha bei yake kwa kujiamini. Takwimu ni zake; AI ilizipanga tu.",
    },
    skills: {
      en: "Margins and pricing, checking AI arithmetic, using your own data safely.",
      fr: "Marges et prix, vérifier les calculs de l’IA, utiliser ses propres données en sécurité.",
      sw: "Faida na bei, kukagua hesabu za AI, kutumia data yako kwa usalama.",
    },
    labSlug: "ai-small-business-lab-5-margins-and-pricing",
  },
];

/** The cases of one track, in file order. */
export function casesForTrack(trackSlug: string): RealCase[] {
  return CASES.filter((c) => c.trackSlug === trackSlug);
}

/** A field in the learner's language, English when missing. */
export function pick<T>(v: { en: T; fr: T; sw: T }, locale: string): T {
  return locale === "fr" ? v.fr : locale === "sw" ? v.sw : v.en;
}
