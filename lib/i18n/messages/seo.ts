import { tri } from "./pages/_tri";

// Namespace "seo": the "Key takeaways" and FAQ blocks on public pages, the
// fact sheet (/about/facts) and the page titles added for search. Every
// answer must stay true: these sentences are what search and AI engines
// quote. Prices, counts and track names are passed in from code and the
// database ({from}, {monthly}, {n}...), never typed here.

export default tri({
  // ── Shared ───────────────────────────────────────────────────────────────
  "seo.takeaways": ["Key takeaways", "L'essentiel", "Mambo muhimu"],
  "seo.faq": ["Frequently asked questions", "Questions fréquentes", "Maswali yanayoulizwa mara kwa mara"],
  "seo.home": ["Home", "Accueil", "Nyumbani"],
  "seo.tools": ["Tools", "Outils", "Zana"],
  "seo.store": ["Store", "Boutique", "Duka"],
  "seo.events": ["Events", "Événements", "Matukio"],
  "seo.about": ["About", "À propos", "Kuhusu"],
  "seo.academy": ["ARFA AI Academy", "Académie IA ARFA", "Chuo cha AI cha ARFA"],

  // ── Page titles and descriptions added for search ───────────────────────
  "seo.meta.scanner.title": ["Free Website AI Scanner: AI Readiness Score", "Scanner IA gratuit : score de maturité IA du site", "Skana ya AI ya Tovuti Bure: Alama ya Utayari wa AI"],
  "seo.meta.scanner.description": [
    "Scan any website for free and get an instant AI readiness score: structured data, AI crawler access, llms.txt, speed, SEO and mobile checks.",
    "Analysez gratuitement n'importe quel site : score de maturité IA immédiat, données structurées, accès des robots IA, llms.txt, vitesse, SEO et mobile.",
    "Changanua tovuti yoyote bure upate alama ya utayari wa AI papo hapo: data iliyopangwa, ufikiaji wa roboti za AI, llms.txt, kasi, SEO na simu.",
  ],
  "seo.meta.advisor.title": ["AI Project Advisor (retired)", "Conseiller de projet IA (retiré)", "Mshauri wa Miradi ya AI (imestaafu)"],
  "seo.meta.getStarted.description": [
    "Tell TIBLOGICS what you need: AI implementation, automation, consulting, web or mobile. Get a free 30-minute call and a written plan before you commit.",
    "Dites à TIBLOGICS ce dont vous avez besoin : IA, automatisation, conseil, web ou mobile. Un appel gratuit de 30 minutes et un plan écrit avant tout engagement.",
    "Iambie TIBLOGICS unachohitaji: AI, otomatiki, ushauri, tovuti au simu. Pata simu ya bure ya dakika 30 na mpango wa maandishi kabla ya kujitolea.",
  ],
  "seo.meta.monitor.title": ["Readiness Monitor: AI Readiness vs Competitors", "Readiness Monitor : votre maturité IA face aux concurrents", "Readiness Monitor: Utayari wa AI dhidi ya Washindani"],
  "seo.meta.blueprint.title": ["Automation Blueprint: Your Written Automation Plan", "Automation Blueprint : votre plan d'automatisation écrit", "Automation Blueprint: Mpango Wako wa Otomatiki"],
  "seo.meta.calculator.title": ["AI Product Cost Calculator: API Costs by Model", "Calculateur de coûts IA : coûts d'API par modèle", "Kikokotoo cha Gharama za AI kwa Kila Modeli"],
  "seo.meta.store.title": ["AI Toolkits & Prompt Packs Store", "Boutique de kits et prompts IA", "Duka la Vifaa na Prompts za AI"],
  "seo.meta.store.description": [
    "Industry AI toolkits and prompt packs from TIBLOGICS: ready-to-use prompts for real estate, finance, agencies, restaurants and nonprofits. Instant download.",
    "Kits IA et packs de prompts par secteur, par TIBLOGICS : immobilier, finance, agences, restauration et associations. Téléchargement immédiat.",
    "Vifaa vya AI na vifurushi vya prompts kwa kila sekta kutoka TIBLOGICS: mali isiyohamishika, fedha, mashirika, migahawa na mashirika yasiyo ya faida. Pakua papo hapo.",
  ],
  "seo.meta.trainingTerms.title": ["AI Practical Training: Terms & Conditions", "Formation pratique à l'IA : conditions générales", "Mafunzo ya Vitendo ya AI: Masharti"],
  "seo.meta.facts.title": ["TIBLOGICS at a Glance: Company Facts", "TIBLOGICS en bref : les faits", "TIBLOGICS kwa Ufupi: Taarifa za Kampuni"],
  "seo.meta.facts.description": [
    "Quick facts about TIBLOGICS: who we are, what we do, where we work, our AI services, the ARFA AI Academy, our tools and how to contact us.",
    "TIBLOGICS en bref : qui nous sommes, ce que nous faisons, où nous travaillons, nos services d'IA, l'Académie IA ARFA, nos outils et nos contacts.",
    "TIBLOGICS kwa ufupi: sisi ni nani, tunachofanya, tunakofanya kazi, huduma zetu za AI, Chuo cha AI cha ARFA, zana zetu na jinsi ya kuwasiliana nasi.",
  ],
  "seo.meta.track.description": [
    "Online {level} AI course from the ARFA AI Academy: about {hours} hours, {price} once or every track for {monthly}/month, certificate included. {tagline}",
    "Cours d'IA en ligne, niveau {level}, de l'Académie IA ARFA : environ {hours} h, {price} en une fois ou tous les parcours à {monthly}/mois, certificat inclus. {tagline}",
    "Kozi ya AI mtandaoni, kiwango cha {level}, kutoka Chuo cha AI cha ARFA: takriban saa {hours}, {price} mara moja au kozi zote kwa {monthly}/mwezi, pamoja na cheti. {tagline}",
  ],
  "seo.levelRange": ["{a} to {b}", "{a} à {b}", "{a} hadi {b}"],

  // ── Home: the questions people ask about the company ────────────────────
  "seo.home.faq.1.q": ["What does TIBLOGICS do?", "Que fait TIBLOGICS ?", "TIBLOGICS hufanya nini?"],
  "seo.home.faq.1.a": [
    "TIBLOGICS is an AI implementation and digital solutions agency. It builds custom AI agents, workflow automation, web and mobile applications and data analytics solutions for businesses in North America, Africa and beyond, and runs ARFA, an AI academy.",
    "TIBLOGICS est une agence de mise en œuvre de l'IA et de solutions numériques. Elle conçoit des agents IA sur mesure, de l'automatisation des processus, des applications web et mobiles et des solutions d'analyse de données pour les entreprises d'Amérique du Nord, d'Afrique et d'ailleurs, et dirige ARFA, une académie de l'IA.",
    "TIBLOGICS ni wakala wa utekelezaji wa AI na suluhisho za kidijitali. Hujenga mawakala wa AI, otomatiki ya michakato, app za tovuti na simu, na suluhisho za uchambuzi wa data kwa biashara za Amerika Kaskazini, Afrika na kwingineko, na huendesha ARFA, chuo cha AI.",
  ],
  "seo.home.faq.2.q": ["How do I get started with TIBLOGICS?", "Comment commencer avec TIBLOGICS ?", "Ninaanzaje na TIBLOGICS?"],
  "seo.home.faq.2.a": [
    "Book a free 30-minute discovery call at tiblogics.com/book. You describe the problem; if we are the right fit, you get a written plan with scope, approach, timeline and cost before anyone commits to anything.",
    "Réservez un appel découverte gratuit de 30 minutes sur tiblogics.com/book. Vous décrivez le problème ; si nous sommes les bonnes personnes, vous recevez un plan écrit (périmètre, approche, calendrier et coût) avant tout engagement.",
    "Weka simu ya utambuzi ya bure ya dakika 30 kwenye tiblogics.com/book. Unaeleza tatizo; tukiwa watu sahihi, unapata mpango wa maandishi wenye wigo, mbinu, ratiba na gharama kabla ya mtu yeyote kujitolea.",
  ],
  "seo.home.faq.3.q": ["Does TIBLOGICS work with small businesses?", "TIBLOGICS travaille-t-elle avec les petites entreprises ?", "Je, TIBLOGICS hufanya kazi na biashara ndogo?"],
  "seo.home.faq.3.a": [
    "Yes. Making AI accessible to businesses of every size is one of our core commitments. We work with solo operators, small businesses and large enterprises alike.",
    "Oui. Rendre l'IA accessible aux entreprises de toutes tailles est l'un de nos engagements fondamentaux. Nous travaillons aussi bien avec des indépendants et des petites entreprises qu'avec de grands groupes.",
    "Ndiyo. Kufanya AI ifikike kwa biashara za kila ukubwa ni mojawapo ya ahadi zetu kuu. Tunafanya kazi na wajasiriamali binafsi, biashara ndogo na makampuni makubwa vilevile.",
  ],
  "seo.home.faq.4.q": ["Which markets and languages does TIBLOGICS serve?", "Quels marchés et quelles langues TIBLOGICS couvre-t-elle ?", "TIBLOGICS huhudumia masoko na lugha zipi?"],
  "seo.home.faq.4.a": [
    "TIBLOGICS primarily serves the United States and African markets, including francophone Africa, with bilingual English and French delivery, and works with clients worldwide. The website is also available in Swahili.",
    "TIBLOGICS sert principalement les marchés américain et africains, y compris l'Afrique francophone, en anglais comme en français, et travaille avec des clients du monde entier. Le site existe aussi en swahili.",
    "TIBLOGICS huhudumia hasa masoko ya Marekani na Afrika, ikiwemo Afrika inayozungumza Kifaransa, kwa Kiingereza na Kifaransa, na hufanya kazi na wateja duniani kote. Tovuti inapatikana pia kwa Kiswahili.",
  ],

  // ── ARFA catalog (/learning-box) ─────────────────────────────────────────
  "seo.arfa.tldr.1": [
    "ARFA (AI Readiness For All) is the TIBLOGICS AI Academy: self-paced online AI courses that each end in a verifiable certificate.",
    "ARFA (AI Readiness For All) est l'Académie IA de TIBLOGICS : des cours d'IA en ligne, à votre rythme, qui se terminent chacun par un certificat vérifiable.",
    "ARFA (AI Readiness For All) ni Chuo cha AI cha TIBLOGICS: kozi za AI mtandaoni kwa kasi yako, kila moja ikiishia na cheti kinachoweza kuthibitishwa.",
  ],
  "seo.arfa.tldr.2": [
    "{n} tracks are open now, from beginner to advanced, each taking about {min} to {max} hours.",
    "{n} parcours sont ouverts, du niveau débutant au niveau avancé, de {min} à {max} heures chacun environ.",
    "Kozi {n} ziko wazi sasa, kuanzia kiwango cha mwanzo hadi cha juu, kila moja ikichukua takriban saa {min} hadi {max}.",
  ],
  "seo.arfa.tldr.3": [
    "Own one track for a one-time payment from {from}, or get every track for {monthly} a month; cancel anytime.",
    "Achetez un parcours en une fois dès {from}, ou accédez à tous les parcours pour {monthly} par mois, résiliable à tout moment.",
    "Miliki kozi moja kwa malipo ya mara moja kuanzia {from}, au pata kozi zote kwa {monthly} kwa mwezi; sitisha wakati wowote.",
  ],
  "seo.arfa.tldr.4": [
    "Courses are available in English and French.",
    "Les cours sont proposés en anglais et en français.",
    "Kozi zinapatikana kwa Kiingereza na Kifaransa.",
  ],
  "seo.arfa.tldr.5": [
    "Each certificate requires module quizzes, a timed final exam and a capstone reviewed by a person, and has a public verification link.",
    "Chaque certificat exige des quiz de module, un examen final chronométré et un projet final relu par une personne, et dispose d'un lien de vérification public.",
    "Kila cheti kinahitaji majaribio ya kila moduli, mtihani wa mwisho wenye muda maalum na mradi wa mwisho unaokaguliwa na mtu, na kina kiungo cha uthibitisho kwa umma.",
  ],
  "seo.arfa.faq.what.q": ["What is ARFA?", "Qu'est-ce qu'ARFA ?", "ARFA ni nini?"],
  "seo.arfa.faq.what.a": [
    "ARFA stands for AI Readiness For All. It is the AI Academy of TIBLOGICS, an AI implementation agency: online certificate tracks that teach you to use AI properly, with hands-on labs, a quiz after each module, a timed final exam and a capstone project reviewed by a person.",
    "ARFA signifie AI Readiness For All (l'IA pour tous). C'est l'Académie IA de TIBLOGICS, une agence de mise en œuvre de l'IA : des parcours certifiants en ligne pour apprendre à bien utiliser l'IA, avec des ateliers pratiques, un quiz par module, un examen final chronométré et un projet final relu par une personne.",
    "ARFA inamaanisha AI Readiness For All (Utayari wa AI kwa Wote). Ni Chuo cha AI cha TIBLOGICS, wakala wa utekelezaji wa AI: kozi za vyeti mtandaoni zinazokufundisha kutumia AI ipasavyo, kwa mazoezi ya vitendo, jaribio baada ya kila moduli, mtihani wa mwisho wenye muda na mradi wa mwisho unaokaguliwa na mtu.",
  ],
  "seo.arfa.faq.cost.q": ["How much does ARFA cost?", "Combien coûte ARFA ?", "ARFA inagharimu kiasi gani?"],
  "seo.arfa.faq.cost.a": [
    "Each track can be bought once, with lifetime access to that track, for {from} to {to} depending on its level. A subscription at {monthly} a month includes every track and can be cancelled anytime. Companies can also buy seats for their teams.",
    "Chaque parcours s'achète en une fois, avec un accès à vie à ce parcours, de {from} à {to} selon son niveau. L'abonnement à {monthly} par mois donne accès à tous les parcours et se résilie à tout moment. Les entreprises peuvent aussi acheter des places pour leurs équipes.",
    "Kila kozi inaweza kununuliwa mara moja, ukipata ufikiaji wa kudumu wa kozi hiyo, kwa {from} hadi {to} kulingana na kiwango chake. Usajili wa {monthly} kwa mwezi unajumuisha kozi zote na unaweza kusitishwa wakati wowote. Makampuni yanaweza pia kununua nafasi kwa timu zao.",
  ],
  "seo.arfa.faq.french.q": ["Are the courses available in French?", "Les cours sont-ils disponibles en français ?", "Je, kozi zinapatikana kwa Kifaransa?"],
  "seo.arfa.faq.french.a": [
    "Yes. Every ARFA track is offered in English and French; pick your language with the language switcher at the bottom of any page.",
    "Oui. Tous les parcours ARFA sont proposés en anglais et en français ; choisissez votre langue avec le sélecteur en bas de chaque page.",
    "Ndiyo. Kila kozi ya ARFA inatolewa kwa Kiingereza na Kifaransa; chagua lugha yako kwa kibadilisha lugha kilicho chini ya kila ukurasa.",
  ],
  "seo.arfa.faq.cert.q": ["Do I get a certificate?", "Est-ce que j'obtiens un certificat ?", "Je, napata cheti?"],
  "seo.arfa.faq.cert.a": [
    "Yes. Each track ends with its own certificate once you pass every module quiz, the timed final exam and a capstone project reviewed by a person. Every certificate has a public verification page that anyone, such as an employer, can check.",
    "Oui. Chaque parcours se termine par son propre certificat, une fois réussis tous les quiz de module, l'examen final chronométré et un projet final relu par une personne. Chaque certificat a une page de vérification publique que n'importe qui, un employeur par exemple, peut consulter.",
    "Ndiyo. Kila kozi inaishia na cheti chake baada ya kufaulu majaribio yote ya moduli, mtihani wa mwisho wenye muda na mradi wa mwisho unaokaguliwa na mtu. Kila cheti kina ukurasa wa uthibitisho wa umma ambao mtu yeyote, kama mwajiri, anaweza kuuangalia.",
  ],
  "seo.arfa.faq.start.q": ["Do I need any experience with AI?", "Faut-il déjà connaître l'IA ?", "Je, nahitaji uzoefu wowote wa AI?"],
  "seo.arfa.faq.start.a": [
    "No. The first level starts from your first prompt. Each level assumes the one before it, so you can start at a higher level if you already use AI every day.",
    "Non. Le premier niveau part de votre tout premier prompt. Chaque niveau suppose acquis le précédent : vous pouvez donc commencer plus haut si vous utilisez déjà l'IA tous les jours.",
    "Hapana. Kiwango cha kwanza kinaanzia prompt yako ya kwanza kabisa. Kila kiwango kinadhani umemaliza kilichotangulia, kwa hiyo unaweza kuanza juu zaidi ikiwa tayari unatumia AI kila siku.",
  ],
  "seo.arfa.faq.time.q": ["How long does a track take?", "Combien de temps dure un parcours ?", "Kozi moja inachukua muda gani?"],
  "seo.arfa.faq.time.a": [
    "About {min} to {max} hours per track, including labs, quizzes and the exam. It is self-paced with no deadline.",
    "Environ {min} à {max} heures par parcours, ateliers, quiz et examen compris. Vous avancez à votre rythme, sans date limite.",
    "Takriban saa {min} hadi {max} kwa kila kozi, pamoja na mazoezi, majaribio na mtihani. Unasoma kwa kasi yako bila tarehe ya mwisho.",
  ],
  "seo.arfa.faq.business.q": ["Is ARFA good for small businesses?", "ARFA convient-elle aux petites entreprises ?", "Je, ARFA inafaa biashara ndogo?"],
  "seo.arfa.faq.business.a": [
    "Yes. The {track} track is written for small businesses: {tagline} Team plans also let a company buy seats for its staff.",
    "Oui. Le parcours {track} est conçu pour les petites entreprises : {tagline} Les offres équipe permettent aussi à une entreprise d'acheter des places pour ses collaborateurs.",
    "Ndiyo. Kozi ya {track} imeandaliwa kwa ajili ya biashara ndogo: {tagline} Mipango ya timu pia inaruhusu kampuni kununua nafasi kwa wafanyakazi wake.",
  ],
  "seo.arfa.faq.parents.q": ["Is there a course for parents?", "Existe-t-il un parcours pour les parents ?", "Je, kuna kozi kwa wazazi?"],
  "seo.arfa.faq.parents.a": [
    "Yes: {track}. {tagline}",
    "Oui : {track}. {tagline}",
    "Ndiyo: {track}. {tagline}",
  ],
  "seo.arfa.faq.offline.q": ["Can I learn on my phone or offline?", "Puis-je apprendre sur mon téléphone ou hors ligne ?", "Je, naweza kusoma kwenye simu au bila mtandao?"],
  "seo.arfa.faq.offline.a": [
    "Yes. ARFA installs as an app on your phone or computer, and you can download lessons to keep learning offline.",
    "Oui. ARFA s'installe comme une application sur votre téléphone ou votre ordinateur, et vous pouvez télécharger les leçons pour continuer hors ligne.",
    "Ndiyo. ARFA inasakinishwa kama app kwenye simu au kompyuta yako, na unaweza kupakua masomo ili kuendelea kusoma bila mtandao.",
  ],

  // ── One track (/learning-box/[slug]) ─────────────────────────────────────
  "seo.track.tldr.what": [
    "{title} is a self-paced online course from ARFA, the TIBLOGICS AI Academy, at {level} level.",
    "{title} est un cours en ligne, à votre rythme, de l'Académie IA ARFA de TIBLOGICS, de niveau {level}.",
    "{title} ni kozi ya mtandaoni kwa kasi yako kutoka ARFA, Chuo cha AI cha TIBLOGICS, ya kiwango cha {level}.",
  ],
  "seo.track.tldr.size": [
    "About {hours} hours: {modules} modules and {lessons} lessons, with hands-on practice.",
    "Environ {hours} heures : {modules} modules et {lessons} leçons, avec de la pratique.",
    "Takriban saa {hours}: moduli {modules} na masomo {lessons}, pamoja na mazoezi ya vitendo.",
  ],
  "seo.track.tldr.price": [
    "{price} once for lifetime access to this track, or every track for {monthly} a month.",
    "{price} en une fois pour un accès à vie à ce parcours, ou tous les parcours pour {monthly} par mois.",
    "{price} mara moja kwa ufikiaji wa kudumu wa kozi hii, au kozi zote kwa {monthly} kwa mwezi.",
  ],
  "seo.track.tldr.cert": [
    "Certificate: {cert}, with a public verification link.",
    "Certificat : {cert}, avec un lien de vérification public.",
    "Cheti: {cert}, chenye kiungo cha uthibitisho kwa umma.",
  ],
  "seo.track.tldr.lang": [
    "Available in English and French.",
    "Disponible en anglais et en français.",
    "Inapatikana kwa Kiingereza na Kifaransa.",
  ],
  "seo.track.faq.lang.q": ["Is this course available in French?", "Ce cours est-il disponible en français ?", "Je, kozi hii inapatikana kwa Kifaransa?"],
  "seo.track.faq.lang.a": [
    "Yes. The track is offered in English and French; choose your language with the language switcher at the bottom of the page.",
    "Oui. Le parcours est proposé en anglais et en français ; choisissez votre langue avec le sélecteur en bas de page.",
    "Ndiyo. Kozi inatolewa kwa Kiingereza na Kifaransa; chagua lugha yako kwa kibadilisha lugha kilicho chini ya ukurasa.",
  ],

  // ── Services ─────────────────────────────────────────────────────────────
  "seo.services.tldr.1": [
    "TIBLOGICS is an AI implementation agency for businesses in North America and Africa, working in English and French.",
    "TIBLOGICS est une agence de mise en œuvre de l'IA pour les entreprises d'Amérique du Nord et d'Afrique, en anglais et en français.",
    "TIBLOGICS ni wakala wa utekelezaji wa AI kwa biashara za Amerika Kaskazini na Afrika, kwa Kiingereza na Kifaransa.",
  ],
  "seo.services.tldr.2": [
    "Core services: AI implementation and agents, workflow automation, and AI strategy and consulting.",
    "Services clés : mise en œuvre de l'IA et agents, automatisation des processus, stratégie et conseil en IA.",
    "Huduma kuu: utekelezaji wa AI na mawakala, otomatiki ya michakato, na mkakati na ushauri wa AI.",
  ],
  "seo.services.tldr.3": [
    "Also: web and app development, mobile apps, cybersecurity, data analytics, system design and IoT, and AI training through the ARFA AI Academy.",
    "Aussi : développement web et d'applications, applications mobiles, cybersécurité, analyse de données, architecture système et IoT, et formation à l'IA avec l'Académie IA ARFA.",
    "Pia: utengenezaji wa tovuti na app, app za simu, usalama wa mtandao, uchambuzi wa data, usanifu wa mifumo na IoT, na mafunzo ya AI kupitia Chuo cha AI cha ARFA.",
  ],
  "seo.services.tldr.4": [
    "Every engagement starts with a free 30-minute call, then a written plan with scope, timeline and cost before anyone commits.",
    "Chaque mission commence par un appel gratuit de 30 minutes, puis un plan écrit (périmètre, calendrier, coût) avant tout engagement.",
    "Kila kazi huanza na simu ya bure ya dakika 30, kisha mpango wa maandishi wenye wigo, ratiba na gharama kabla ya mtu yeyote kujitolea.",
  ],
  "seo.services.faq.automation.q": ["Which automation tools does TIBLOGICS use?", "Quels outils d'automatisation TIBLOGICS utilise-t-elle ?", "TIBLOGICS hutumia zana zipi za otomatiki?"],
  "seo.services.faq.automation.a": [
    "n8n, Make, Zapier and custom pipelines, chosen to fit the software you already use. For AI work we build custom agents, LLM integrations and RAG systems.",
    "n8n, Make, Zapier et des chaînes sur mesure, choisis en fonction des logiciels que vous utilisez déjà. Pour l'IA, nous concevons des agents sur mesure, des intégrations de LLM et des systèmes RAG.",
    "n8n, Make, Zapier na mifumo maalum, huchaguliwa kulingana na programu unazotumia tayari. Kwa kazi za AI tunajenga mawakala maalum, kuunganisha LLM na mifumo ya RAG.",
  ],
  "seo.services.faq.training.q": ["Can TIBLOGICS train my team on AI?", "TIBLOGICS peut-elle former mon équipe à l'IA ?", "Je, TIBLOGICS inaweza kufundisha timu yangu AI?"],
  "seo.services.faq.training.a": [
    "Yes: team workshops, on-site training, and self-paced certificate tracks on ARFA, the TIBLOGICS AI Academy, with seats for teams.",
    "Oui : ateliers d'équipe, formations sur site et parcours certifiants à votre rythme sur ARFA, l'Académie IA de TIBLOGICS, avec des places pour les équipes.",
    "Ndiyo: warsha za timu, mafunzo ya ana kwa ana, na kozi za vyeti kwa kasi yako kwenye ARFA, Chuo cha AI cha TIBLOGICS, zenye nafasi kwa timu.",
  ],
  "seo.services.faq.after.q": ["What happens after the project is built?", "Que se passe-t-il une fois le projet livré ?", "Nini hufuata baada ya mradi kujengwa?"],
  "seo.services.faq.after.a": [
    "Handover, training, or we keep running it for you: whichever leaves you in the better position.",
    "Transfert, formation, ou nous continuons à le faire tourner pour vous : ce qui vous laisse dans la meilleure position.",
    "Kukabidhi, mafunzo, au tunaendelea kuuendesha kwa niaba yako: chochote kitakachokuweka katika nafasi bora.",
  ],

  // ── Tools hub ────────────────────────────────────────────────────────────
  "seo.tools.tldr.1": [
    "Free, no signup: the Website AI Scanner (an instant AI readiness score for any site) and the AI Product Cost Calculator.",
    "Gratuits, sans inscription : le scanner IA de site web (un score de maturité IA immédiat pour n'importe quel site) et le calculateur de coûts de produit IA.",
    "Bure, bila kujisajili: Skana ya AI ya Tovuti (alama ya utayari wa AI papo hapo kwa tovuti yoyote) na Kikokotoo cha Gharama za Bidhaa ya AI.",
  ],
  "seo.tools.tldr.2": [
    "Paid: Toolkit Live with Compliance Guard (industry prompt libraries), the Automation Blueprint (a written automation plan) and the Readiness Monitor (weekly scans against competitors).",
    "Payants : Toolkit Live avec Compliance Guard (bibliothèques de prompts par secteur), l'Automation Blueprint (un plan d'automatisation écrit) et le Readiness Monitor (analyses hebdomadaires face à vos concurrents).",
    "Za kulipia: Toolkit Live pamoja na Compliance Guard (maktaba za prompts kwa kila sekta), Automation Blueprint (mpango wa otomatiki wa maandishi) na Readiness Monitor (uchanganuzi wa kila wiki dhidi ya washindani).",
  ],
  "seo.tools.faq.free.q": ["Are the TIBLOGICS AI tools free?", "Les outils IA de TIBLOGICS sont-ils gratuits ?", "Je, zana za AI za TIBLOGICS ni bure?"],
  "seo.tools.faq.free.a": [
    "The Website AI Scanner and the AI Product Cost Calculator are free and need no signup. Toolkit Live, the Automation Blueprint and the Readiness Monitor are paid.",
    "Le scanner IA de site web et le calculateur de coûts de produit IA sont gratuits, sans inscription. Toolkit Live, l'Automation Blueprint et le Readiness Monitor sont payants.",
    "Skana ya AI ya Tovuti na Kikokotoo cha Gharama za Bidhaa ya AI ni bure na hazihitaji kujisajili. Toolkit Live, Automation Blueprint na Readiness Monitor ni za kulipia.",
  ],
  "seo.tools.faq.scanner.q": ["What does the Website AI Scanner check?", "Que vérifie le scanner IA de site web ?", "Skana ya AI ya Tovuti hukagua nini?"],
  "seo.tools.faq.scanner.a": [
    "Structured data that AI assistants can read, whether AI crawlers are blocked, llms.txt, sitemap and robots.txt, title, description and social previews, server response time and page weight, and mobile viewport, alt text and headings.",
    "Les données structurées lisibles par les assistants IA, le blocage éventuel des robots IA, llms.txt, le sitemap et robots.txt, le titre, la description et les aperçus sociaux, le temps de réponse du serveur et le poids des pages, ainsi que l'affichage mobile, les textes alternatifs et les titres.",
    "Data iliyopangwa ambayo wasaidizi wa AI wanaweza kusoma, kama roboti za AI zimezuiwa, llms.txt, sitemap na robots.txt, kichwa, maelezo na mionekano ya mitandao ya kijamii, muda wa seva kujibu na uzito wa ukurasa, na mwonekano wa simu, maandishi mbadala na vichwa.",
  ],
  "seo.tools.faq.monitor.q": ["What is the Readiness Monitor?", "Qu'est-ce que le Readiness Monitor ?", "Readiness Monitor ni nini?"],
  "seo.tools.faq.monitor.a": [
    "A subscription that rescans your website and up to three competitors every week with the same checks as the free scanner, and emails you only when something changes.",
    "Un abonnement qui analyse chaque semaine votre site et jusqu'à trois concurrents avec les mêmes vérifications que le scanner gratuit, et ne vous écrit que lorsque quelque chose change.",
    "Usajili unaochanganua upya tovuti yako na hadi washindani watatu kila wiki kwa ukaguzi uleule wa skana ya bure, na hukutumia barua pepe pale tu kitu kinapobadilika.",
  ],

  // ── Toolkit Live ─────────────────────────────────────────────────────────
  "seo.tk.tldr.1": [
    "Toolkit Live gives you {n} ready-to-run AI prompts for {fields} fields, filled in with your business details and written in your voice.",
    "Toolkit Live vous donne {n} prompts IA prêts à l'emploi pour {fields} secteurs, complétés avec les informations de votre entreprise et rédigés dans votre style.",
    "Toolkit Live inakupa prompts {n} za AI zilizo tayari kwa nyanja {fields}, zilizojazwa taarifa za biashara yako na kuandikwa kwa sauti yako.",
  ],
  "seo.tk.tldr.2": [
    "Compliance Guard flags Fair Housing, financial-advertising and FTC risks in any draft before you publish. It is a screening tool, not legal advice.",
    "Compliance Guard signale les risques Fair Housing, de publicité financière et FTC dans n'importe quel texte avant publication. C'est un outil de détection, pas un avis juridique.",
    "Compliance Guard huonyesha hatari za Fair Housing, matangazo ya kifedha na FTC katika rasimu yoyote kabla hujachapisha. Ni zana ya uchunguzi, si ushauri wa kisheria.",
  ],
  "seo.tk.tldr.3": [
    "Monthly subscription, cancel anytime. Drafts are written by Anthropic's Claude, and what you send is not used to train its models.",
    "Abonnement mensuel, résiliable à tout moment. Les textes sont rédigés par Claude d'Anthropic, et ce que vous envoyez ne sert pas à entraîner ses modèles.",
    "Usajili wa kila mwezi, sitisha wakati wowote. Rasimu huandikwa na Claude wa Anthropic, na unachotuma hakitumiki kufunza modeli zake.",
  ],

  // ── Automation Blueprint ─────────────────────────────────────────────────
  "seo.bp.tldr.1": [
    "The Automation Blueprint is a written plan for automating up to three of your repetitive processes.",
    "L'Automation Blueprint est un plan écrit pour automatiser jusqu'à trois de vos tâches répétitives.",
    "Automation Blueprint ni mpango wa maandishi wa kuendesha kiotomatiki hadi michakato mitatu yako inayojirudia.",
  ],
  "seo.bp.tldr.2": [
    "It maps where the time goes, ranks what to automate and with which tools, and gives you a week-by-week roadmap.",
    "Il montre où part le temps, classe ce qu'il faut automatiser et avec quels outils, et propose une feuille de route semaine par semaine.",
    "Unaonyesha muda unakokwenda, unapanga nini cha kuendesha kiotomatiki na kwa zana zipi, na unakupa ramani ya wiki kwa wiki.",
  ],
  "seo.bp.tldr.price": [
    "{price}, one time, credited against the build if you hire TIBLOGICS within {days} days.",
    "{price}, en une fois, déduit du projet si vous confiez la réalisation à TIBLOGICS dans les {days} jours.",
    "{price}, mara moja, hupunguzwa kwenye gharama za ujenzi ukiajiri TIBLOGICS ndani ya siku {days}.",
  ],
  "seo.bp.tldr.noPrice": [
    "Credited against the build if you hire TIBLOGICS within {days} days.",
    "Déduit du projet si vous confiez la réalisation à TIBLOGICS dans les {days} jours.",
    "Hupunguzwa kwenye gharama za ujenzi ukiajiri TIBLOGICS ndani ya siku {days}.",
  ],
  "seo.bp.faq.get.q": ["What do I get in an Automation Blueprint?", "Que contient un Automation Blueprint ?", "Ninapata nini katika Automation Blueprint?"],
  "seo.bp.faq.get.a": [
    "Each process mapped as it runs today with the hours it takes, specific automation opportunities ranked by effort and built on the software you already pay for wherever possible, quick wins for this week, a phased roadmap, the risks to watch and the numbers to track.",
    "Chaque processus décrit tel qu'il fonctionne aujourd'hui avec les heures qu'il prend, des pistes d'automatisation concrètes classées par effort et fondées autant que possible sur les logiciels que vous payez déjà, des gains rapides pour cette semaine, une feuille de route par étapes, les risques à surveiller et les indicateurs à suivre.",
    "Kila mchakato ukielezwa jinsi unavyoendeshwa leo pamoja na saa unazochukua, fursa mahususi za otomatiki zilizopangwa kwa juhudi zinazohitajika na zinazotumia programu unazolipia tayari pale inapowezekana, mafanikio ya haraka ya wiki hii, ramani ya hatua, hatari za kuangalia na takwimu za kufuatilia.",
  ],
  "seo.bp.faq.time.q": ["How fast is it delivered?", "En combien de temps est-il livré ?", "Unawasilishwa kwa haraka kiasi gani?"],
  "seo.bp.faq.time.a": [
    "Usually within a few minutes of payment. You get a private link and a credit code by email, then a second email when the blueprint is ready.",
    "Généralement quelques minutes après le paiement. Vous recevez par e-mail un lien privé et un code de crédit, puis un second e-mail quand le plan est prêt.",
    "Kwa kawaida ndani ya dakika chache baada ya malipo. Unapata kiungo binafsi na msimbo wa punguzo kwa barua pepe, kisha barua pepe ya pili mpango ukiwa tayari.",
  ],
  "seo.bp.faq.credit.q": ["Is the price credited if TIBLOGICS builds it?", "Le prix est-il déduit si TIBLOGICS réalise le projet ?", "Je, bei hupunguzwa TIBLOGICS ikiijenga?"],
  "seo.bp.faq.credit.a": [
    "Yes. Hire TIBLOGICS to build any part of the plan within {days} days and what you paid comes off the project.",
    "Oui. Confiez à TIBLOGICS la réalisation de n'importe quelle partie du plan dans les {days} jours, et ce que vous avez payé est déduit du projet.",
    "Ndiyo. Ajiri TIBLOGICS kujenga sehemu yoyote ya mpango ndani ya siku {days} na ulicholipa hupunguzwa kwenye gharama za mradi.",
  ],

  // ── Fact sheet (/about/facts) ────────────────────────────────────────────
  "seo.facts.h1": ["TIBLOGICS at a glance", "TIBLOGICS en bref", "TIBLOGICS kwa ufupi"],
  "seo.facts.intro": [
    "The key facts about TIBLOGICS in one place, written to be quoted. Last reviewed {date}.",
    "Les faits essentiels sur TIBLOGICS, réunis en un seul endroit et rédigés pour être cités. Dernière mise à jour : {date}.",
    "Taarifa muhimu kuhusu TIBLOGICS mahali pamoja, zimeandikwa ili zinukuliwe. Zilipitiwa mara ya mwisho {date}.",
  ],
  "seo.facts.who.k": ["What TIBLOGICS is", "Ce qu'est TIBLOGICS", "TIBLOGICS ni nini"],
  "seo.facts.who.v": [
    "TIBLOGICS is an AI implementation and digital solutions agency. It builds AI agents, workflow automation and full-stack digital products for businesses.",
    "TIBLOGICS est une agence de mise en œuvre de l'IA et de solutions numériques. Elle conçoit des agents IA, de l'automatisation des processus et des produits numériques complets pour les entreprises.",
    "TIBLOGICS ni wakala wa utekelezaji wa AI na suluhisho za kidijitali. Hujenga mawakala wa AI, otomatiki ya michakato na bidhaa kamili za kidijitali kwa biashara.",
  ],
  "seo.facts.founder.k": ["Founder", "Fondateur", "Mwanzilishi"],
  "seo.facts.founder.v": [
    "TIBLOGICS was founded by Tieyiwe Bassole, its Founder and CEO.",
    "TIBLOGICS a été fondée par Tieyiwe Bassole, son fondateur et PDG.",
    "TIBLOGICS ilianzishwa na Tieyiwe Bassole, Mwanzilishi na Mkurugenzi Mtendaji wake.",
  ],
  "seo.facts.where.k": ["Where it works", "Où elle intervient", "Inakofanya kazi"],
  "seo.facts.where.v": [
    "TIBLOGICS primarily serves the United States, Canada and Africa, including francophone Africa, and works with clients worldwide.",
    "TIBLOGICS sert principalement les États-Unis, le Canada et l'Afrique, y compris l'Afrique francophone, et travaille avec des clients du monde entier.",
    "TIBLOGICS huhudumia hasa Marekani, Kanada na Afrika, ikiwemo Afrika inayozungumza Kifaransa, na hufanya kazi na wateja duniani kote.",
  ],
  "seo.facts.lang.k": ["Languages", "Langues", "Lugha"],
  "seo.facts.lang.v": [
    "Services are delivered in English and French. The website is available in English, French and Swahili.",
    "Les services sont assurés en anglais et en français. Le site est disponible en anglais, en français et en swahili.",
    "Huduma hutolewa kwa Kiingereza na Kifaransa. Tovuti inapatikana kwa Kiingereza, Kifaransa na Kiswahili.",
  ],
  "seo.facts.services.k": ["Services", "Services", "Huduma"],
  "seo.facts.start.k": ["How projects start", "Comment démarre un projet", "Jinsi miradi inavyoanza"],
  "seo.facts.start.v": [
    "With a free 30-minute discovery call, then a written plan with scope, approach, timeline and cost before anyone commits.",
    "Par un appel découverte gratuit de 30 minutes, puis un plan écrit (périmètre, approche, calendrier et coût) avant tout engagement.",
    "Kwa simu ya utambuzi ya bure ya dakika 30, kisha mpango wa maandishi wenye wigo, mbinu, ratiba na gharama kabla ya mtu yeyote kujitolea.",
  ],
  "seo.facts.products.k": ["Products", "Produits", "Bidhaa"],
  "seo.facts.p.arfa": [
    "ARFA AI Academy (AI Readiness For All): {n} self-paced AI certificate tracks in English and French, from {from} per track or {monthly} a month for every track.",
    "Académie IA ARFA (AI Readiness For All) : {n} parcours certifiants en IA, à votre rythme, en anglais et en français, dès {from} le parcours ou {monthly} par mois pour tous les parcours.",
    "Chuo cha AI cha ARFA (AI Readiness For All): kozi {n} za vyeti vya AI kwa kasi yako, kwa Kiingereza na Kifaransa, kuanzia {from} kwa kozi au {monthly} kwa mwezi kwa kozi zote.",
  ],
  "seo.facts.p.toolkit": [
    "Toolkit Live and Compliance Guard: industry AI prompt libraries filled in with your business details, with a compliance check on every draft.",
    "Toolkit Live et Compliance Guard : des bibliothèques de prompts IA par secteur, complétées avec vos informations, avec une vérification de conformité sur chaque texte.",
    "Toolkit Live na Compliance Guard: maktaba za prompts za AI kwa kila sekta zilizojazwa taarifa za biashara yako, pamoja na ukaguzi wa kanuni kwa kila rasimu.",
  ],
  "seo.facts.p.blueprint": [
    "Automation Blueprint: a written plan for automating up to three repetitive processes.",
    "Automation Blueprint : un plan écrit pour automatiser jusqu'à trois tâches répétitives.",
    "Automation Blueprint: mpango wa maandishi wa kuendesha kiotomatiki hadi michakato mitatu inayojirudia.",
  ],
  "seo.facts.p.monitor": [
    "Readiness Monitor: weekly AI-readiness scans of your website and up to three competitors.",
    "Readiness Monitor : des analyses hebdomadaires de maturité IA de votre site et de jusqu'à trois concurrents.",
    "Readiness Monitor: uchanganuzi wa kila wiki wa utayari wa AI wa tovuti yako na hadi washindani watatu.",
  ],
  "seo.facts.p.free": [
    "Free tools: the Website AI Scanner and the AI Product Cost Calculator.",
    "Outils gratuits : le scanner IA de site web et le calculateur de coûts de produit IA.",
    "Zana za bure: Skana ya AI ya Tovuti na Kikokotoo cha Gharama za Bidhaa ya AI.",
  ],
  "seo.facts.p.store": [
    "Store: industry AI toolkits and prompt packs, delivered as instant downloads.",
    "Boutique : des kits IA et des packs de prompts par secteur, livrés en téléchargement immédiat.",
    "Duka: vifaa vya AI na vifurushi vya prompts kwa kila sekta, hupakuliwa papo hapo.",
  ],
  "seo.facts.p.aitimes": [
    "AI Times: a publication on AI for business, in English, French and Swahili.",
    "AI Times : une publication sur l'IA pour les entreprises, en anglais, en français et en swahili.",
    "AI Times: chapisho kuhusu AI kwa biashara, kwa Kiingereza, Kifaransa na Kiswahili.",
  ],
  "seo.facts.p.events": [
    "Events: live AI trainings and workshops.",
    "Événements : formations et ateliers IA en direct.",
    "Matukio: mafunzo na warsha za AI za moja kwa moja.",
  ],
  "seo.facts.contact.k": ["Contact", "Contact", "Mawasiliano"],
  "seo.facts.contact.general": ["General enquiries", "Demandes générales", "Maswali ya jumla"],
  "seo.facts.contact.founder": ["The founder", "Le fondateur", "Mwanzilishi"],
  "seo.facts.contact.academy": ["ARFA AI Academy", "Académie IA ARFA", "Chuo cha AI cha ARFA"],
  "seo.facts.contact.book": ["Book a free 30-minute call", "Réserver un appel gratuit de 30 minutes", "Weka simu ya bure ya dakika 30"],
  "seo.facts.online.k": ["Online", "En ligne", "Mtandaoni"],
  "seo.facts.more": [
    "For AI assistants and search engines: a plain-text summary is at /llms.txt and the full version at /llms-full.txt.",
    "Pour les assistants IA et les moteurs de recherche : un résumé en texte brut se trouve sur /llms.txt et la version complète sur /llms-full.txt.",
    "Kwa wasaidizi wa AI na injini za utafutaji: muhtasari wa maandishi uko kwenye /llms.txt na toleo kamili kwenye /llms-full.txt.",
  ],
  "seo.facts.link": ["Company facts at a glance", "TIBLOGICS en bref", "Taarifa za kampuni kwa ufupi"],
});
