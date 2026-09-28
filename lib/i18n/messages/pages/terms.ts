import { tri } from "./_tri";

// Terms of Service. Keys under "pages.terms.doc." are rendered in order by
// app/(public)/_i18n/LegalDoc.tsx: <section>.<block>.<type>.
const MAIL = '<a href="mailto:info@tiblogics.com" class="text-[#2251A3] hover:underline">info@tiblogics.com</a>';

export default tri({
  // Shared by both legal pages
  "pages.legal.tag": ["Legal", "Mentions légales", "Kisheria"],
  "pages.legal.dates": [
    "Effective Date: {effective} · Last Updated: {updated}",
    "Date d'entrée en vigueur : {effective} · Dernière mise à jour : {updated}",
    "Tarehe ya Kuanza Kutumika: {effective} · Ilisasishwa Mwisho: {updated}",
  ],
  // Shown only on translations (see the legal pages).
  "pages.legal.bindingNote": [
    "This translation is provided for convenience. The English version is the legally binding one.",
    "Cette traduction est fournie à titre indicatif. Seule la version anglaise fait foi juridiquement.",
    "Tafsiri hii imetolewa kwa urahisi wa kusoma tu. Toleo la Kiingereza ndilo lenye nguvu ya kisheria.",
  ],
  "pages.legal.email": ["Email:", "E-mail :", "Email:"],
  "pages.legal.website": ["Website:", "Site web :", "Tovuti:"],

  "pages.terms.meta.title": ["Terms of Service | TIBLOGICS", "Conditions d'utilisation | TIBLOGICS", "Masharti ya Huduma | TIBLOGICS"],
  "pages.terms.meta.description": [
    "Terms and conditions governing use of TIBLOGICS services.",
    "Conditions générales régissant l'utilisation des services de TIBLOGICS.",
    "Sheria na masharti yanayosimamia matumizi ya huduma za TIBLOGICS.",
  ],
  "pages.terms.title": ["Terms of Service", "Conditions d'utilisation", "Masharti ya Huduma"],

  // Intro
  "pages.terms.doc.00.01.p": [
    "These Terms of Service (\"<strong>Terms</strong>\") constitute a legally binding agreement between you (\"<strong>Client</strong>\", \"<strong>you</strong>\", or \"<strong>your</strong>\") and <strong>TIBLOGICS LLC</strong> (\"<strong>TIBLOGICS</strong>\", \"<strong>we</strong>\", \"<strong>us</strong>\", or \"<strong>our</strong>\"), governing your access to and use of the TIBLOGICS website at <strong>tiblogics.com</strong> (the \"<strong>Site</strong>\") and all related services, products, tools, consultations, and deliverables (collectively, the \"<strong>Services</strong>\").",
    "Les présentes Conditions d'utilisation (les « <strong>Conditions</strong> ») constituent un accord juridiquement contraignant entre vous (le « <strong>Client</strong> » ou « <strong>vous</strong> ») et <strong>TIBLOGICS LLC</strong> (« <strong>TIBLOGICS</strong> », « <strong>nous</strong> » ou « <strong>notre</strong> »), régissant votre accès au site web de TIBLOGICS à l'adresse <strong>tiblogics.com</strong> (le « <strong>Site</strong> ») et votre utilisation de celui-ci, ainsi que de l'ensemble des services, produits, outils, consultations et livrables associés (collectivement, les « <strong>Services</strong> »).",
    "Masharti haya ya Huduma (\"<strong>Masharti</strong>\") ni makubaliano yanayofunga kisheria kati yako (\"<strong>Mteja</strong>\", \"<strong>wewe</strong>\", au \"<strong>yako</strong>\") na <strong>TIBLOGICS LLC</strong> (\"<strong>TIBLOGICS</strong>\", \"<strong>sisi</strong>\", au \"<strong>yetu</strong>\"), yanayosimamia ufikiaji na matumizi yako ya tovuti ya TIBLOGICS iliyoko <strong>tiblogics.com</strong> (\"<strong>Tovuti</strong>\") na huduma, bidhaa, zana, ushauri, na matokeo yote ya kazi yanayohusiana (kwa pamoja, \"<strong>Huduma</strong>\").",
  ],
  "pages.terms.doc.00.02.p": [
    "<strong>By accessing the Site, submitting an inquiry, booking a consultation, making a payment, or engaging TIBLOGICS for any service, you acknowledge that you have read, understood, and agree to be bound by these Terms.</strong> If you do not agree, do not use our Site or Services.",
    "<strong>En accédant au Site, en envoyant une demande, en réservant une consultation, en effectuant un paiement ou en faisant appel à TIBLOGICS pour un service quelconque, vous reconnaissez avoir lu et compris les présentes Conditions et acceptez d'y être lié.</strong> Si vous ne les acceptez pas, n'utilisez pas notre Site ni nos Services.",
    "<strong>Kwa kufikia Tovuti, kutuma ombi, kuweka miadi ya ushauri, kufanya malipo, au kuitumia TIBLOGICS kwa huduma yoyote, unakiri kwamba umesoma, umeelewa, na unakubali kufungwa na Masharti haya.</strong> Ikiwa hukubaliani, usitumie Tovuti wala Huduma zetu.",
  ],
  "pages.terms.doc.00.03.p": [
    "These Terms apply to all visitors, prospects, clients, and users of our Site and Services. Additional project-specific terms may apply and will be set out in a separate Statement of Work (SOW) or Service Agreement executed between the parties.",
    "Les présentes Conditions s'appliquent à l'ensemble des visiteurs, prospects, clients et utilisateurs de notre Site et de nos Services. Des conditions supplémentaires propres à un projet peuvent s'appliquer ; elles figureront dans un cahier des charges (Statement of Work, SOW) ou un contrat de services distinct conclu entre les parties.",
    "Masharti haya yanahusu wageni wote, wateja watarajiwa, wateja, na watumiaji wa Tovuti na Huduma zetu. Masharti ya ziada ya mradi mahususi yanaweza kuhusika na yataelezwa katika Hati ya Kazi (Statement of Work, SOW) au Mkataba wa Huduma tofauti utakaosainiwa na pande zote mbili.",
  ],

  // 1
  "pages.terms.doc.01.01.h2": ["1. Services", "1. Services", "1. Huduma"],
  "pages.terms.doc.01.02.h3": ["1.1 Scope of Services", "1.1 Étendue des Services", "1.1 Wigo wa Huduma"],
  "pages.terms.doc.01.03.p": [
    "TIBLOGICS provides AI implementation, workflow automation, software development, digital strategy, consulting, training, and related technology services. The specific scope, timeline, deliverables, and fees for any engagement are defined in a mutually executed Statement of Work, proposal, or service agreement (\"<strong>SOW</strong>\").",
    "TIBLOGICS fournit des services de mise en œuvre de l'IA, d'automatisation des processus, de développement logiciel, de stratégie numérique, de conseil, de formation et d'autres services technologiques connexes. Le périmètre, le calendrier, les livrables et les honoraires propres à chaque mission sont définis dans un cahier des charges, une proposition ou un contrat de services signé par les deux parties (le « <strong>SOW</strong> »).",
    "TIBLOGICS inatoa huduma za utekelezaji wa AI, otomatiki ya michakato ya kazi, utengenezaji wa programu, mkakati wa kidijitali, ushauri, mafunzo, na huduma nyingine za teknolojia zinazohusiana. Wigo, ratiba, matokeo ya kazi, na ada mahususi za kila kazi hufafanuliwa katika Hati ya Kazi, pendekezo, au mkataba wa huduma uliosainiwa na pande zote mbili (\"<strong>SOW</strong>\").",
  ],
  "pages.terms.doc.01.04.h3": ["1.2 Consultations and Bookings", "1.2 Consultations et réservations", "1.2 Ushauri na Miadi"],
  "pages.terms.doc.01.05.p": [
    "Free discovery calls and paid consultations may be booked through our Site. Bookings are subject to availability and confirmation by TIBLOGICS. We reserve the right to decline any booking at our sole discretion.",
    "Les appels découverte gratuits et les consultations payantes peuvent être réservés sur notre Site. Les réservations sont soumises à disponibilité et à la confirmation de TIBLOGICS. Nous nous réservons le droit de refuser toute réservation à notre seule discrétion.",
    "Simu za utambuzi bila malipo na vikao vya ushauri vya kulipia vinaweza kuwekwa kupitia Tovuti yetu. Miadi inategemea nafasi iliyopo na uthibitisho wa TIBLOGICS. Tuna haki ya kukataa miadi yoyote kwa uamuzi wetu pekee.",
  ],
  "pages.terms.doc.01.06.h3": ["1.3 Modifications to Services", "1.3 Modification des Services", "1.3 Mabadiliko ya Huduma"],
  "pages.terms.doc.01.07.p": [
    "TIBLOGICS reserves the right to modify, suspend, or discontinue any feature of the Site or Services at any time with or without notice. We will not be liable to you or any third party for any such modification, suspension, or discontinuation.",
    "TIBLOGICS se réserve le droit de modifier, de suspendre ou d'interrompre toute fonctionnalité du Site ou des Services à tout moment, avec ou sans préavis. Nous ne serons pas responsables envers vous ni envers un tiers de toute modification, suspension ou interruption de ce type.",
    "TIBLOGICS ina haki ya kubadilisha, kusimamisha, au kusitisha kipengele chochote cha Tovuti au Huduma wakati wowote, kwa taarifa au bila taarifa. Hatutawajibika kwako wala kwa mtu yeyote wa tatu kwa mabadiliko, usimamishaji, au usitishaji wowote wa aina hiyo.",
  ],
  "pages.terms.doc.01.08.h3": ["1.4 AI-Powered Features", "1.4 Fonctionnalités reposant sur l'IA", "1.4 Vipengele Vinavyoendeshwa na AI"],
  "pages.terms.doc.01.09.p": [
    "Our Site includes AI-powered tools and assistants. These features are provided for informational and convenience purposes only. Outputs generated by AI are not guaranteed to be accurate, complete, or suitable for any particular purpose. You should independently verify any AI-generated content before relying on it for business or legal decisions.",
    "Notre Site comprend des outils et des assistants reposant sur l'IA. Ces fonctionnalités sont fournies uniquement à titre informatif et pratique. L'exactitude, l'exhaustivité ou l'adéquation à un usage particulier des résultats générés par l'IA ne sont pas garanties. Vous devez vérifier de manière indépendante tout contenu généré par l'IA avant de vous y fier pour des décisions commerciales ou juridiques.",
    "Tovuti yetu ina zana na wasaidizi wanaoendeshwa na AI. Vipengele hivi vinatolewa kwa madhumuni ya taarifa na urahisi pekee. Hakuna uhakika kwamba matokeo yanayotolewa na AI ni sahihi, kamili, au yanafaa kwa madhumuni fulani. Unapaswa kuthibitisha mwenyewe maudhui yoyote yaliyotolewa na AI kabla ya kuyategemea kwa maamuzi ya kibiashara au ya kisheria.",
  ],

  // 2
  "pages.terms.doc.02.01.h2": ["2. Client Responsibilities", "2. Obligations du Client", "2. Wajibu wa Mteja"],
  "pages.terms.doc.02.02.p": ["You agree to:", "Vous vous engagez à :", "Unakubali:"],
  "pages.terms.doc.02.03.li": [
    "Provide accurate, complete, and timely information necessary for the delivery of Services",
    "fournir en temps utile des informations exactes et complètes, nécessaires à la prestation des Services ;",
    "Kutoa kwa wakati taarifa sahihi na kamili zinazohitajika kwa utoaji wa Huduma",
  ],
  "pages.terms.doc.02.04.li": [
    "Make timely payments as agreed in the applicable SOW or payment schedule",
    "effectuer les paiements dans les délais convenus dans le SOW ou l'échéancier applicable ;",
    "Kufanya malipo kwa wakati kama ilivyokubaliwa katika SOW au ratiba ya malipo inayohusika",
  ],
  "pages.terms.doc.02.05.li": [
    "Promptly review and provide feedback on deliverables within agreed timeframes",
    "examiner rapidement les livrables et faire part de vos commentaires dans les délais convenus ;",
    "Kupitia matokeo ya kazi haraka na kutoa maoni ndani ya muda uliokubaliwa",
  ],
  "pages.terms.doc.02.06.li": [
    "Ensure you have all necessary rights, licences, and permissions for any materials, data, or content you provide to TIBLOGICS",
    "vous assurer de disposer de tous les droits, licences et autorisations nécessaires pour les documents, données ou contenus que vous fournissez à TIBLOGICS ;",
    "Kuhakikisha una haki, leseni, na ruhusa zote zinazohitajika kwa nyaraka, data, au maudhui yoyote unayoipa TIBLOGICS",
  ],
  "pages.terms.doc.02.07.li": [
    "Comply with all applicable laws and regulations in connection with your use of the Services",
    "respecter toutes les lois et réglementations applicables dans le cadre de votre utilisation des Services ;",
    "Kutii sheria na kanuni zote zinazohusika kuhusiana na matumizi yako ya Huduma",
  ],
  "pages.terms.doc.02.08.li": [
    "Not use the Services for any unlawful, fraudulent, harmful, or abusive purpose",
    "ne pas utiliser les Services à des fins illicites, frauduleuses, nuisibles ou abusives ;",
    "Kutotumia Huduma kwa madhumuni yoyote yasiyo halali, ya udanganyifu, yenye madhara, au ya matumizi mabaya",
  ],
  "pages.terms.doc.02.09.li": [
    "Not attempt to reverse-engineer, copy, or misappropriate any TIBLOGICS proprietary methods, tools, or systems",
    "ne pas tenter de faire de l'ingénierie inverse, de copier ou de s'approprier indûment les méthodes, outils ou systèmes propriétaires de TIBLOGICS.",
    "Kutojaribu kuchambua kinyume (reverse-engineer), kunakili, au kujimilikisha isivyo halali mbinu, zana, au mifumo yoyote ya umiliki ya TIBLOGICS",
  ],
  "pages.terms.doc.02.10.p": [
    "Failure to meet these responsibilities may result in project delays, additional fees, or termination of Services. TIBLOGICS will not be liable for delays or failures caused by your failure to fulfil these obligations.",
    "Le non-respect de ces obligations peut entraîner des retards de projet, des frais supplémentaires ou la résiliation des Services. TIBLOGICS ne sera pas responsable des retards ou manquements résultant du non-respect de ces obligations de votre part.",
    "Kushindwa kutimiza wajibu huu kunaweza kusababisha ucheleweshaji wa mradi, ada za ziada, au kusitishwa kwa Huduma. TIBLOGICS haitawajibika kwa ucheleweshaji au kushindwa kunakosababishwa na wewe kutotimiza wajibu huu.",
  ],

  // 3
  "pages.terms.doc.03.01.h2": ["3. Fees, Payments, and Refunds", "3. Honoraires, paiements et remboursements", "3. Ada, Malipo, na Marejesho ya Fedha"],
  "pages.terms.doc.03.02.h3": ["3.1 Fees", "3.1 Honoraires", "3.1 Ada"],
  "pages.terms.doc.03.03.p": [
    "Fees for Services are set out in the applicable SOW, proposal, or booking confirmation. All fees are stated in US Dollars (USD) unless otherwise specified. TIBLOGICS reserves the right to adjust pricing with reasonable notice for new or renewed engagements.",
    "Les honoraires des Services sont indiqués dans le SOW, la proposition ou la confirmation de réservation applicable. Sauf mention contraire, tous les montants sont exprimés en dollars américains (USD). TIBLOGICS se réserve le droit d'ajuster ses tarifs, moyennant un préavis raisonnable, pour les missions nouvelles ou renouvelées.",
    "Ada za Huduma zimeelezwa katika SOW, pendekezo, au uthibitisho wa miadi unaohusika. Ada zote zimetajwa kwa Dola za Marekani (USD) isipokuwa imeelezwa vinginevyo. TIBLOGICS ina haki ya kurekebisha bei kwa kutoa taarifa ya muda unaofaa kwa kazi mpya au zinazorejeshwa upya.",
  ],
  "pages.terms.doc.03.04.h3": ["3.2 Payment Terms", "3.2 Modalités de paiement", "3.2 Masharti ya Malipo"],
  "pages.terms.doc.03.05.p": [
    "Unless otherwise agreed in writing, payment terms are as follows:",
    "Sauf accord écrit contraire, les modalités de paiement sont les suivantes :",
    "Isipokuwa imekubaliwa vinginevyo kwa maandishi, masharti ya malipo ni kama ifuatavyo:",
  ],
  "pages.terms.doc.03.06.li": [
    "Consultations and one-time services: payment in full at the time of booking",
    "consultations et services ponctuels : paiement intégral au moment de la réservation ;",
    "Ushauri na huduma za mara moja: malipo kamili wakati wa kuweka miadi",
  ],
  "pages.terms.doc.03.07.li": [
    "Project-based engagements: 50% deposit upon agreement, remainder due upon project completion or as specified in the SOW",
    "missions au forfait : acompte de 50 % à la signature, solde dû à l'achèvement du projet ou selon les modalités du SOW ;",
    "Kazi za kimradi: amana ya asilimia 50 wakati wa makubaliano, kiasi kilichobaki hulipwa mradi ukikamilika au kama ilivyoelezwa katika SOW",
  ],
  "pages.terms.doc.03.08.li": [
    "Retainer engagements: payment due on the first of each billing cycle",
    "contrats d'abonnement (retainer) : paiement exigible le premier jour de chaque période de facturation.",
    "Mikataba ya malipo ya kudumu (retainer): malipo hufanyika siku ya kwanza ya kila kipindi cha malipo",
  ],
  "pages.terms.doc.03.09.p": [
    "Invoices not paid within 14 days of the due date are subject to a late fee of 1.5% per month (or the maximum permitted by law, whichever is lower) on the outstanding balance.",
    "Les factures non réglées dans les 14 jours suivant la date d'échéance sont soumises à une pénalité de retard de 1,5 % par mois (ou au taux maximal autorisé par la loi, si celui-ci est inférieur) sur le solde restant dû.",
    "Ankara zisizolipwa ndani ya siku 14 baada ya tarehe ya mwisho zitatozwa ada ya kuchelewa ya asilimia 1.5 kwa mwezi (au kiwango cha juu kinachoruhusiwa na sheria, kilicho chini zaidi) juu ya salio linalodaiwa.",
  ],
  "pages.terms.doc.03.10.h3": ["3.3 Refund Policy", "3.3 Politique de remboursement", "3.3 Sera ya Marejesho ya Fedha"],
  "pages.terms.doc.03.11.p": [
    "<strong>Consultations:</strong> Cancellations made at least 24 hours before a scheduled consultation will receive a full refund. Cancellations made with less than 24 hours notice are non-refundable. No-shows forfeit the full consultation fee.",
    "<strong>Consultations :</strong> toute annulation effectuée au moins 24 heures avant une consultation programmée donne lieu à un remboursement intégral. Les annulations effectuées moins de 24 heures à l'avance ne sont pas remboursables. En cas d'absence, la totalité des honoraires de consultation reste due.",
    "<strong>Ushauri:</strong> Kughairi kunakofanywa angalau saa 24 kabla ya kikao cha ushauri kilichopangwa kutapata marejesho kamili. Kughairi kunakofanywa chini ya saa 24 kabla hakurejeshewi fedha. Asiyehudhuria hupoteza ada yote ya ushauri.",
  ],
  "pages.terms.doc.03.12.p": [
    "<strong>Project-based work:</strong> The initial deposit is non-refundable once work has commenced. If TIBLOGICS fails to deliver agreed-upon milestones through no fault of the client, TIBLOGICS will provide a pro-rated refund for work not completed.",
    "<strong>Travaux au forfait :</strong> l'acompte initial n'est pas remboursable une fois les travaux commencés. Si TIBLOGICS ne livre pas les étapes convenues sans que le client en soit responsable, TIBLOGICS procédera à un remboursement au prorata des travaux non réalisés.",
    "<strong>Kazi za kimradi:</strong> Amana ya awali hairejeshwi mara kazi inapoanza. Ikiwa TIBLOGICS itashindwa kukamilisha hatua zilizokubaliwa bila kosa la mteja, TIBLOGICS itarejesha fedha kwa uwiano wa kazi ambayo haikukamilika.",
  ],
  "pages.terms.doc.03.13.p": [
    "<strong>Retainers:</strong> Retainer fees are non-refundable for the current billing period. Either party may cancel with 30 days written notice.",
    "<strong>Abonnements (retainer) :</strong> les honoraires d'abonnement ne sont pas remboursables pour la période de facturation en cours. Chaque partie peut résilier moyennant un préavis écrit de 30 jours.",
    "<strong>Mikataba ya malipo ya kudumu:</strong> Ada za retainer hazirejeshwi kwa kipindi cha malipo kinachoendelea. Upande wowote unaweza kusitisha kwa kutoa taarifa ya maandishi ya siku 30.",
  ],
  "pages.terms.doc.03.14.p": [
    "<strong>Digital products and courses:</strong> All sales of digital products, courses, and downloadable materials are final and non-refundable unless the product is materially defective or misrepresented.",
    "<strong>Produits numériques et formations :</strong> toutes les ventes de produits numériques, de formations et de contenus téléchargeables sont définitives et non remboursables, sauf si le produit présente un défaut important ou a été présenté de manière trompeuse.",
    "<strong>Bidhaa za kidijitali na kozi:</strong> Mauzo yote ya bidhaa za kidijitali, kozi, na nyaraka zinazopakuliwa ni ya mwisho na hayarejeshewi fedha, isipokuwa bidhaa ina kasoro kubwa au ilielezwa kwa njia ya kupotosha.",
  ],
  "pages.terms.doc.03.15.h3": ["3.4 Taxes", "3.4 Taxes", "3.4 Kodi"],
  "pages.terms.doc.03.16.p": [
    "You are responsible for all applicable taxes, duties, and levies arising from your purchase of Services, except for taxes on TIBLOGICS's net income. If required by law, TIBLOGICS may collect and remit applicable sales tax.",
    "Vous êtes responsable de l'ensemble des taxes, droits et prélèvements applicables découlant de votre achat de Services, à l'exception des impôts sur le revenu net de TIBLOGICS. Si la loi l'exige, TIBLOGICS peut percevoir et reverser la taxe sur les ventes applicable.",
    "Unawajibika kwa kodi, ushuru, na tozo zote zinazohusika zinazotokana na ununuzi wako wa Huduma, isipokuwa kodi za mapato halisi ya TIBLOGICS. Ikiwa sheria inataka hivyo, TIBLOGICS inaweza kukusanya na kuwasilisha kodi ya mauzo inayohusika.",
  ],

  // 4
  "pages.terms.doc.04.01.h2": ["4. Intellectual Property", "4. Propriété intellectuelle", "4. Hakimiliki na Mali ya Kiakili"],
  "pages.terms.doc.04.02.h3": ["4.1 TIBLOGICS IP", "4.1 Propriété intellectuelle de TIBLOGICS", "4.1 Mali ya Kiakili ya TIBLOGICS"],
  "pages.terms.doc.04.03.p": [
    "All content on this Site (including text, graphics, logos, images, code, tools, blog posts, training materials, and the overall design) is the exclusive intellectual property of TIBLOGICS LLC or its licensors and is protected by applicable copyright, trademark, and trade secret laws. Nothing in these Terms grants you any right to use TIBLOGICS's name, logo, trademarks, or proprietary materials without our prior written consent.",
    "L'ensemble du contenu de ce Site (y compris les textes, graphismes, logos, images, code, outils, articles de blog, supports de formation et la conception d'ensemble) est la propriété intellectuelle exclusive de TIBLOGICS LLC ou de ses concédants de licence et est protégé par les lois applicables en matière de droit d'auteur, de marques et de secrets d'affaires. Aucune disposition des présentes Conditions ne vous confère le droit d'utiliser le nom, le logo, les marques ou les contenus propriétaires de TIBLOGICS sans notre accord écrit préalable.",
    "Maudhui yote ya Tovuti hii (ikiwemo maandishi, michoro, nembo, picha, msimbo, zana, makala za blogu, nyenzo za mafunzo, na muundo mzima) ni mali ya kiakili ya kipekee ya TIBLOGICS LLC au watoa leseni wake na yanalindwa na sheria zinazohusika za hakimiliki, alama za biashara, na siri za biashara. Hakuna kifungu chochote katika Masharti haya kinachokupa haki ya kutumia jina, nembo, alama za biashara, au nyenzo za umiliki za TIBLOGICS bila idhini yetu ya maandishi iliyotolewa mapema.",
  ],
  "pages.terms.doc.04.04.h3": ["4.2 Deliverables Ownership", "4.2 Propriété des livrables", "4.2 Umiliki wa Matokeo ya Kazi"],
  "pages.terms.doc.04.05.p": [
    "Unless expressly stated otherwise in a written SOW, upon receipt of full payment, TIBLOGICS assigns to the Client all rights, title, and interest in the final deliverables created specifically for that Client under the engagement.",
    "Sauf stipulation expresse contraire dans un SOW écrit, dès réception du paiement intégral, TIBLOGICS cède au Client l'ensemble des droits, titres et intérêts sur les livrables finaux créés spécifiquement pour ce Client dans le cadre de la mission.",
    "Isipokuwa imeelezwa waziwazi vinginevyo katika SOW ya maandishi, baada ya kupokea malipo kamili, TIBLOGICS inamkabidhi Mteja haki zote, umiliki, na maslahi katika matokeo ya mwisho ya kazi yaliyotengenezwa mahususi kwa ajili ya Mteja huyo chini ya kazi hiyo.",
  ],
  "pages.terms.doc.04.06.p": [
    "TIBLOGICS retains ownership of: (a) all pre-existing TIBLOGICS tools, frameworks, libraries, and methodologies incorporated into deliverables; (b) general-purpose code and components not developed specifically for Client; and (c) any deliverables for which full payment has not been received. TIBLOGICS is granted a perpetual, non-exclusive licence to use deliverables for portfolio, case study, and promotional purposes unless the Client requests confidentiality in writing prior to project commencement.",
    "TIBLOGICS conserve la propriété : (a) de l'ensemble des outils, frameworks, bibliothèques et méthodologies préexistants de TIBLOGICS intégrés aux livrables ; (b) du code et des composants à usage général qui n'ont pas été développés spécifiquement pour le Client ; et (c) de tout livrable dont le paiement intégral n'a pas été reçu. TIBLOGICS bénéficie d'une licence perpétuelle et non exclusive d'utilisation des livrables à des fins de portfolio, d'étude de cas et de promotion, sauf si le Client demande la confidentialité par écrit avant le démarrage du projet.",
    "TIBLOGICS inabaki na umiliki wa: (a) zana, mifumo (frameworks), maktaba, na mbinu zote za TIBLOGICS zilizokuwepo kabla na zilizojumuishwa katika matokeo ya kazi; (b) msimbo na vijenzi vya matumizi ya jumla ambavyo havikutengenezwa mahususi kwa Mteja; na (c) matokeo yoyote ya kazi ambayo malipo kamili hayajapokelewa. TIBLOGICS inapewa leseni ya kudumu isiyo ya kipekee ya kutumia matokeo ya kazi kwa madhumuni ya maonyesho ya kazi (portfolio), mifano ya kazi, na matangazo, isipokuwa Mteja ameomba usiri kwa maandishi kabla ya kuanza kwa mradi.",
  ],
  "pages.terms.doc.04.07.h3": ["4.3 Client Content", "4.3 Contenus du Client", "4.3 Maudhui ya Mteja"],
  "pages.terms.doc.04.08.p": [
    "You retain ownership of all content, data, and materials you provide to TIBLOGICS. You grant TIBLOGICS a limited, non-exclusive licence to use your content solely for the purpose of delivering the agreed Services.",
    "Vous conservez la propriété de l'ensemble des contenus, données et documents que vous fournissez à TIBLOGICS. Vous accordez à TIBLOGICS une licence limitée et non exclusive d'utilisation de vos contenus aux seules fins de la prestation des Services convenus.",
    "Unabaki na umiliki wa maudhui, data, na nyaraka zote unazoipa TIBLOGICS. Unaipa TIBLOGICS leseni yenye mipaka isiyo ya kipekee ya kutumia maudhui yako kwa madhumuni ya kutoa Huduma zilizokubaliwa pekee.",
  ],
  "pages.terms.doc.04.09.h3": ["4.4 Feedback", "4.4 Commentaires", "4.4 Maoni"],
  "pages.terms.doc.04.10.p": [
    "Any feedback, suggestions, or ideas you provide about our Services may be used by TIBLOGICS without restriction or compensation to you.",
    "Tout commentaire, suggestion ou idée que vous nous communiquez au sujet de nos Services peut être utilisé par TIBLOGICS sans restriction ni contrepartie à votre égard.",
    "Maoni, mapendekezo, au mawazo yoyote utakayotoa kuhusu Huduma zetu yanaweza kutumiwa na TIBLOGICS bila vikwazo wala fidia kwako.",
  ],

  // 5
  "pages.terms.doc.05.01.h2": ["5. Confidentiality", "5. Confidentialité", "5. Usiri"],
  "pages.terms.doc.05.02.p": [
    "Each party agrees to keep confidential any non-public, proprietary, or sensitive information of the other party that is disclosed in connection with the Services (\"<strong>Confidential Information</strong>\") and not to disclose such information to third parties without prior written consent, except as required by law.",
    "Chaque partie s'engage à garder confidentielle toute information non publique, exclusive ou sensible de l'autre partie divulguée dans le cadre des Services (les « <strong>Informations confidentielles</strong> ») et à ne pas la communiquer à des tiers sans accord écrit préalable, sauf si la loi l'exige.",
    "Kila upande unakubali kutunza kwa siri taarifa yoyote isiyo ya umma, ya umiliki, au nyeti ya upande mwingine iliyofichuliwa kuhusiana na Huduma (\"<strong>Taarifa za Siri</strong>\") na kutoifichua kwa watu wa tatu bila idhini ya maandishi iliyotolewa mapema, isipokuwa pale sheria inapotaka.",
  ],
  "pages.terms.doc.05.03.p": [
    "This obligation does not apply to information that: (a) is or becomes publicly available through no breach of these Terms; (b) was already known to the receiving party prior to disclosure; (c) is independently developed by the receiving party without use of the Confidential Information; or (d) is required to be disclosed by law or court order, provided reasonable prior notice is given.",
    "Cette obligation ne s'applique pas aux informations qui : (a) sont ou deviennent publiques sans violation des présentes Conditions ; (b) étaient déjà connues de la partie destinataire avant leur divulgation ; (c) sont développées de manière indépendante par la partie destinataire sans recours aux Informations confidentielles ; ou (d) doivent être divulguées en vertu de la loi ou d'une décision de justice, sous réserve d'un préavis raisonnable.",
    "Wajibu huu hauhusu taarifa ambazo: (a) ziko wazi kwa umma au zinakuwa wazi bila kukiuka Masharti haya; (b) upande unaopokea ulikuwa tayari unazijua kabla ya kufichuliwa; (c) zimetengenezwa na upande unaopokea wenyewe bila kutumia Taarifa za Siri; au (d) zinatakiwa kufichuliwa kwa sheria au amri ya mahakama, ilimradi taarifa ya mapema ya muda unaofaa imetolewa.",
  ],
  "pages.terms.doc.05.04.p": [
    "Confidentiality obligations survive termination of any engagement for a period of three (3) years unless a separate Non-Disclosure Agreement provides otherwise.",
    "Les obligations de confidentialité survivent à la fin de toute mission pendant une durée de trois (3) ans, sauf disposition contraire d'un accord de confidentialité distinct.",
    "Wajibu wa usiri unaendelea kwa kipindi cha miaka mitatu (3) baada ya kusitishwa kwa kazi yoyote, isipokuwa Mkataba tofauti wa Kutofichua Taarifa unasema vinginevyo.",
  ],

  // 6
  "pages.terms.doc.06.01.h2": ["6. Disclaimer of Warranties", "6. Exclusion de garanties", "6. Kukanusha Dhamana"],
  "pages.terms.doc.06.02.caps": [
    "Important: Please Read Carefully",
    "Important : à lire attentivement",
    "Muhimu: Tafadhali Soma kwa Makini",
  ],
  "pages.terms.doc.06.03.p": [
    "THE SITE AND SERVICES ARE PROVIDED \"<strong>AS IS</strong>\" AND \"<strong>AS AVAILABLE</strong>\" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, OR THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.",
    "LE SITE ET LES SERVICES SONT FOURNIS « <strong>EN L'ÉTAT</strong> » ET « <strong>SELON DISPONIBILITÉ</strong> », SANS GARANTIE D'AUCUNE SORTE, EXPRESSE OU IMPLICITE, Y COMPRIS, SANS S'Y LIMITER, LES GARANTIES DE QUALITÉ MARCHANDE, D'ADÉQUATION À UN USAGE PARTICULIER, DE TITRE, D'ABSENCE DE CONTREFAÇON, OU LA GARANTIE QUE LES SERVICES SERONT ININTERROMPUS, EXEMPTS D'ERREURS OU EXEMPTS DE VIRUS OU D'AUTRES ÉLÉMENTS NUISIBLES.",
    "TOVUTI NA HUDUMA ZINATOLEWA \"<strong>KAMA ZILIVYO</strong>\" NA \"<strong>KADIRI ZINAVYOPATIKANA</strong>\" BILA DHAMANA YA AINA YOYOTE, IWE YA WAZI AU INAYODHANIWA, IKIWEMO LAKINI SI TU DHAMANA ZA UFAAJI WA KIBIASHARA, KUFAA KWA MADHUMUNI FULANI, UMILIKI, KUTOKIUKA HAKI ZA WENGINE, AU KWAMBA HUDUMA HAZITAKATIZWA, HAZITAKUWA NA MAKOSA, AU HAZITAKUWA NA VIRUSI AU VIJENZI VINGINE VYENYE MADHARA.",
  ],
  "pages.terms.doc.06.04.p": [
    "TIBLOGICS DOES NOT WARRANT THAT: (A) THE SERVICES WILL MEET YOUR SPECIFIC REQUIREMENTS; (B) RESULTS OBTAINED FROM USE OF THE SERVICES WILL BE ACCURATE OR RELIABLE; (C) ANY ERRORS OR DEFECTS WILL BE CORRECTED; OR (D) AI-GENERATED CONTENT WILL BE ACCURATE, COMPLETE, OR APPROPRIATE FOR YOUR USE.",
    "TIBLOGICS NE GARANTIT PAS : (A) QUE LES SERVICES RÉPONDRONT À VOS EXIGENCES PARTICULIÈRES ; (B) QUE LES RÉSULTATS OBTENUS PAR L'UTILISATION DES SERVICES SERONT EXACTS OU FIABLES ; (C) QUE LES ERREURS OU DÉFAUTS SERONT CORRIGÉS ; NI (D) QUE LE CONTENU GÉNÉRÉ PAR L'IA SERA EXACT, COMPLET OU ADAPTÉ À VOTRE USAGE.",
    "TIBLOGICS HAITOI DHAMANA KWAMBA: (A) HUDUMA ZITAKIDHI MAHITAJI YAKO MAHUSUSI; (B) MATOKEO YATAKAYOPATIKANA KWA KUTUMIA HUDUMA YATAKUWA SAHIHI AU YA KUAMINIKA; (C) MAKOSA AU KASORO ZOZOTE ZITAREKEBISHWA; AU (D) MAUDHUI YALIYOTOLEWA NA AI YATAKUWA SAHIHI, KAMILI, AU YANAYOFAA KWA MATUMIZI YAKO.",
  ],
  "pages.terms.doc.06.05.p": [
    "Any advice, recommendations, or information provided through our Services or Site is for general informational purposes only and does not constitute legal, financial, medical, or other professional advice.",
    "Les conseils, recommandations ou informations fournis par l'intermédiaire de nos Services ou de notre Site ont une vocation informative générale et ne constituent pas un avis juridique, financier, médical ou professionnel d'aucune sorte.",
    "Ushauri, mapendekezo, au taarifa yoyote inayotolewa kupitia Huduma au Tovuti yetu ni kwa madhumuni ya taarifa za jumla pekee na si ushauri wa kisheria, kifedha, kitabibu, au ushauri mwingine wa kitaalamu.",
  ],

  // 7
  "pages.terms.doc.07.01.h2": ["7. Limitation of Liability", "7. Limitation de responsabilité", "7. Kikomo cha Dhima"],
  "pages.terms.doc.07.02.caps": [
    "Important: Please Read Carefully",
    "Important : à lire attentivement",
    "Muhimu: Tafadhali Soma kwa Makini",
  ],
  "pages.terms.doc.07.03.p": [
    "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL TIBLOGICS LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, AGENTS, AFFILIATES, OR LICENSORS BE LIABLE FOR ANY:",
    "DANS TOUTE LA MESURE PERMISE PAR LA LOI APPLICABLE, TIBLOGICS LLC, SES DIRIGEANTS, ADMINISTRATEURS, EMPLOYÉS, PRESTATAIRES, MANDATAIRES, SOCIÉTÉS AFFILIÉES OU CONCÉDANTS DE LICENCE NE POURRONT EN AUCUN CAS ÊTRE TENUS RESPONSABLES :",
    "KWA KIWANGO CHA JUU KINACHORUHUSIWA NA SHERIA INAYOHUSIKA, KWA HALI YOYOTE ILE TIBLOGICS LLC, MAAFISA WAKE, WAKURUGENZI, WAFANYAKAZI, WAKANDARASI, MAWAKALA, KAMPUNI SHIRIKI, AU WATOA LESENI HAWATAWAJIBIKA KWA:",
  ],
  "pages.terms.doc.07.04.liu": [
    "Indirect, incidental, special, consequential, or punitive damages",
    "des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs ;",
    "Madhara yasiyo ya moja kwa moja, ya bahati mbaya, maalum, yanayotokana na jambo jingine, au ya adhabu",
  ],
  "pages.terms.doc.07.05.liu": [
    "Loss of profits, revenue, data, business, or goodwill",
    "d'une perte de bénéfices, de chiffre d'affaires, de données, d'activité ou de clientèle ;",
    "Upotevu wa faida, mapato, data, biashara, au nia njema ya wateja",
  ],
  "pages.terms.doc.07.06.liu": [
    "Business interruption or loss of anticipated savings",
    "d'une interruption d'activité ou d'une perte d'économies escomptées ;",
    "Kukatizwa kwa biashara au upotevu wa akiba iliyotarajiwa",
  ],
  "pages.terms.doc.07.07.liu": [
    "Damages arising from unauthorised access to or alteration of your data",
    "de dommages résultant d'un accès non autorisé à vos données ou d'une altération de celles-ci ;",
    "Madhara yanayotokana na ufikiaji usioidhinishwa au kubadilishwa kwa data zako",
  ],
  "pages.terms.doc.07.08.liu": [
    "Damages arising from reliance on AI-generated content",
    "de dommages résultant de la confiance accordée à un contenu généré par l'IA.",
    "Madhara yanayotokana na kutegemea maudhui yaliyotolewa na AI",
  ],
  "pages.terms.doc.07.09.p": [
    "WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, EVEN IF TIBLOGICS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
    "QUE CE SOIT SUR LE FONDEMENT D'UNE GARANTIE, D'UN CONTRAT, D'UNE RESPONSABILITÉ DÉLICTUELLE (Y COMPRIS LA NÉGLIGENCE), D'UNE RESPONSABILITÉ SANS FAUTE OU DE TOUTE AUTRE THÉORIE JURIDIQUE, MÊME SI TIBLOGICS A ÉTÉ AVISÉE DE LA POSSIBILITÉ DE TELS DOMMAGES.",
    "IWE KWA MSINGI WA DHAMANA, MKATABA, KOSA LA MADAI (IKIWEMO UZEMBE), DHIMA KAMILI, AU NADHARIA NYINGINE YOYOTE YA KISHERIA, HATA KAMA TIBLOGICS ILIJULISHWA KUHUSU UWEZEKANO WA MADHARA HAYO.",
  ],
  "pages.terms.doc.07.10.p": [
    "IN ALL CASES, TIBLOGICS'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES WILL NOT EXCEED THE GREATER OF: (A) THE TOTAL AMOUNT YOU PAID TO TIBLOGICS IN THE THREE (3) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED US DOLLARS ($100).",
    "DANS TOUS LES CAS, LA RESPONSABILITÉ CUMULÉE TOTALE DE TIBLOGICS ENVERS VOUS AU TITRE DE TOUTE RÉCLAMATION DÉCOULANT DES PRÉSENTES CONDITIONS OU DES SERVICES, OU S'Y RAPPORTANT, NE POURRA EXCÉDER LE PLUS ÉLEVÉ DES MONTANTS SUIVANTS : (A) LE MONTANT TOTAL QUE VOUS AVEZ VERSÉ À TIBLOGICS AU COURS DES TROIS (3) MOIS PRÉCÉDANT LA RÉCLAMATION ; OU (B) CENT DOLLARS AMÉRICAINS (100 $).",
    "KWA HALI ZOTE, JUMLA YA DHIMA YA TIBLOGICS KWAKO KWA MADAI YOYOTE YANAYOTOKANA NA AU YANAYOHUSIANA NA MASHARTI HAYA AU HUDUMA HAITAZIDI KIASI KIKUBWA ZAIDI KATI YA: (A) JUMLA YA KIASI ULICHOILIPA TIBLOGICS KATIKA MIEZI MITATU (3) KABLA YA DAI; AU (B) DOLA MIA MOJA ZA MAREKANI ($100).",
  ],
  "pages.terms.doc.07.11.small": [
    "Some jurisdictions do not allow limitation of liability for certain types of damages. In such jurisdictions, our liability will be limited to the maximum extent permitted by law.",
    "Certaines juridictions n'autorisent pas la limitation de responsabilité pour certains types de dommages. Dans ces juridictions, notre responsabilité sera limitée dans toute la mesure permise par la loi.",
    "Baadhi ya mamlaka za kisheria haziruhusu kuweka kikomo cha dhima kwa aina fulani za madhara. Katika mamlaka hizo, dhima yetu itawekewa kikomo kwa kiwango cha juu kinachoruhusiwa na sheria.",
  ],

  // 8
  "pages.terms.doc.08.01.h2": ["8. Indemnification", "8. Indemnisation", "8. Fidia"],
  "pages.terms.doc.08.02.p": [
    "You agree to defend, indemnify, and hold harmless TIBLOGICS LLC and its officers, directors, employees, contractors, agents, affiliates, and licensors from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising out of or relating to:",
    "Vous acceptez de défendre, d'indemniser et de dégager de toute responsabilité TIBLOGICS LLC ainsi que ses dirigeants, administrateurs, employés, prestataires, mandataires, sociétés affiliées et concédants de licence contre toute réclamation, responsabilité, dommage, jugement, sentence, perte, coût, dépense et honoraire (y compris des honoraires d'avocat raisonnables) découlant de ce qui suit ou s'y rapportant :",
    "Unakubali kuitetea, kuifidia, na kuiepusha na madhara TIBLOGICS LLC pamoja na maafisa wake, wakurugenzi, wafanyakazi, wakandarasi, mawakala, kampuni shiriki, na watoa leseni dhidi ya madai, dhima, madhara, hukumu, tuzo, hasara, gharama, matumizi, na ada zozote (ikiwemo ada za mawakili zinazofaa) zinazotokana na au zinazohusiana na:",
  ],
  "pages.terms.doc.08.03.li": [
    "Your use of the Site or Services in violation of these Terms",
    "votre utilisation du Site ou des Services en violation des présentes Conditions ;",
    "Matumizi yako ya Tovuti au Huduma kwa kukiuka Masharti haya",
  ],
  "pages.terms.doc.08.04.li": [
    "Your violation of any applicable law, regulation, or third-party right",
    "votre violation de toute loi ou réglementation applicable ou de tout droit d'un tiers ;",
    "Ukiukaji wako wa sheria, kanuni, au haki yoyote ya mtu wa tatu inayohusika",
  ],
  "pages.terms.doc.08.05.li": [
    "Any content, data, or materials you provide to TIBLOGICS",
    "tout contenu, donnée ou document que vous fournissez à TIBLOGICS ;",
    "Maudhui, data, au nyaraka zozote unazoipa TIBLOGICS",
  ],
  "pages.terms.doc.08.06.li": [
    "Your fraud, wilful misconduct, or negligence",
    "votre fraude, votre faute intentionnelle ou votre négligence ;",
    "Udanganyifu wako, utovu wa nidhamu wa makusudi, au uzembe wako",
  ],
  "pages.terms.doc.08.07.li": [
    "Any dispute between you and a third party arising from your use of the Services",
    "tout litige entre vous et un tiers découlant de votre utilisation des Services.",
    "Mgogoro wowote kati yako na mtu wa tatu unaotokana na matumizi yako ya Huduma",
  ],

  // 9
  "pages.terms.doc.09.01.h2": ["9. Acceptable Use", "9. Utilisation acceptable", "9. Matumizi Yanayokubalika"],
  "pages.terms.doc.09.02.p": [
    "You agree not to use the Site or Services to:",
    "Vous vous engagez à ne pas utiliser le Site ou les Services pour :",
    "Unakubali kutotumia Tovuti au Huduma ili:",
  ],
  "pages.terms.doc.09.03.li": [
    "Violate any applicable local, national, or international law or regulation",
    "enfreindre toute loi ou réglementation locale, nationale ou internationale applicable ;",
    "Kukiuka sheria au kanuni yoyote ya ndani, ya kitaifa, au ya kimataifa inayohusika",
  ],
  "pages.terms.doc.09.04.li": [
    "Transmit unsolicited communications (spam) or engage in phishing",
    "envoyer des communications non sollicitées (spam) ou vous livrer à de l'hameçonnage ;",
    "Kutuma mawasiliano yasiyoombwa (spam) au kufanya utapeli wa kunasa taarifa (phishing)",
  ],
  "pages.terms.doc.09.05.li": [
    "Upload or transmit malicious code, viruses, or harmful software",
    "téléverser ou transmettre du code malveillant, des virus ou des logiciels nuisibles ;",
    "Kupakia au kusambaza msimbo hasidi, virusi, au programu zenye madhara",
  ],
  "pages.terms.doc.09.06.li": [
    "Attempt to gain unauthorised access to our systems or those of other users",
    "tenter d'accéder sans autorisation à nos systèmes ou à ceux d'autres utilisateurs ;",
    "Kujaribu kupata ufikiaji usioidhinishwa wa mifumo yetu au ya watumiaji wengine",
  ],
  "pages.terms.doc.09.07.li": [
    "Scrape, crawl, or extract data from our Site without written permission",
    "extraire, collecter automatiquement ou aspirer des données de notre Site sans autorisation écrite ;",
    "Kuvuna, kupekua kiotomatiki, au kuchota data kutoka Tovuti yetu bila ruhusa ya maandishi",
  ],
  "pages.terms.doc.09.08.li": [
    "Impersonate TIBLOGICS, our employees, or any other person or entity",
    "usurper l'identité de TIBLOGICS, de nos employés ou de toute autre personne ou entité ;",
    "Kujifanya kuwa TIBLOGICS, wafanyakazi wetu, au mtu au taasisi nyingine yoyote",
  ],
  "pages.terms.doc.09.09.li": [
    "Engage in any activity that disrupts, degrades, or interferes with the Site",
    "vous livrer à toute activité qui perturbe, dégrade ou entrave le fonctionnement du Site ;",
    "Kufanya shughuli yoyote inayovuruga, kudhoofisha, au kuingilia utendaji wa Tovuti",
  ],
  "pages.terms.doc.09.10.li": [
    "Use our AI tools to generate harmful, illegal, or misleading content",
    "utiliser nos outils d'IA pour générer des contenus nuisibles, illégaux ou trompeurs ;",
    "Kutumia zana zetu za AI kutengeneza maudhui yenye madhara, yasiyo halali, au ya kupotosha",
  ],
  "pages.terms.doc.09.11.li": [
    "Circumvent or attempt to circumvent any security measures on the Site",
    "contourner ou tenter de contourner les mesures de sécurité du Site.",
    "Kukwepa au kujaribu kukwepa hatua zozote za usalama kwenye Tovuti",
  ],
  "pages.terms.doc.09.12.p": [
    "Violation of this section may result in immediate suspension or termination of access to the Site and Services, and may be referred to appropriate law enforcement authorities.",
    "Toute violation du présent article peut entraîner la suspension ou la résiliation immédiate de l'accès au Site et aux Services, et peut être signalée aux autorités compétentes.",
    "Ukiukaji wa kifungu hiki unaweza kusababisha kusimamishwa au kusitishwa mara moja kwa ufikiaji wa Tovuti na Huduma, na unaweza kupelekwa kwa vyombo husika vya kusimamia sheria.",
  ],

  // 10
  "pages.terms.doc.10.01.h2": ["10. Termination", "10. Résiliation", "10. Kusitishwa"],
  "pages.terms.doc.10.02.p": [
    "Either party may terminate a service engagement upon written notice as specified in the applicable SOW. TIBLOGICS may terminate or suspend your access to the Site or Services immediately and without notice if you violate these Terms, fail to make required payments, or engage in conduct that TIBLOGICS reasonably determines is harmful to TIBLOGICS, other clients, or third parties.",
    "Chaque partie peut mettre fin à une mission moyennant un préavis écrit, selon les modalités prévues dans le SOW applicable. TIBLOGICS peut résilier ou suspendre votre accès au Site ou aux Services immédiatement et sans préavis si vous enfreignez les présentes Conditions, ne procédez pas aux paiements requis ou adoptez un comportement que TIBLOGICS juge raisonnablement préjudiciable à TIBLOGICS, à d'autres clients ou à des tiers.",
    "Upande wowote unaweza kusitisha kazi ya huduma kwa kutoa taarifa ya maandishi kama ilivyoelezwa katika SOW inayohusika. TIBLOGICS inaweza kusitisha au kusimamisha ufikiaji wako wa Tovuti au Huduma mara moja na bila taarifa ikiwa utakiuka Masharti haya, utashindwa kufanya malipo yanayotakiwa, au utajihusisha na mwenendo ambao TIBLOGICS kwa busara itaona kuwa una madhara kwa TIBLOGICS, wateja wengine, au watu wa tatu.",
  ],
  "pages.terms.doc.10.03.p": [
    "Upon termination: (a) all licences granted to you under these Terms cease immediately; (b) you remain obligated to pay all fees owed for Services rendered prior to termination; (c) TIBLOGICS will retain your data as required by law and our Privacy Policy, then securely delete it; and (d) provisions of these Terms that by their nature should survive will survive, including Sections 4, 5, 6, 7, 8, 12, and 13.",
    "En cas de résiliation : (a) toutes les licences qui vous ont été accordées au titre des présentes Conditions prennent fin immédiatement ; (b) vous restez tenu de régler l'ensemble des honoraires dus pour les Services fournis avant la résiliation ; (c) TIBLOGICS conservera vos données conformément à la loi et à notre Politique de confidentialité, puis les supprimera de manière sécurisée ; et (d) les dispositions des présentes Conditions qui, par nature, ont vocation à survivre survivront, notamment les articles 4, 5, 6, 7, 8, 12 et 13.",
    "Baada ya kusitishwa: (a) leseni zote ulizopewa chini ya Masharti haya zinakoma mara moja; (b) unabaki na wajibu wa kulipa ada zote zinazodaiwa kwa Huduma zilizotolewa kabla ya kusitishwa; (c) TIBLOGICS itahifadhi data zako kama inavyotakiwa na sheria na Sera yetu ya Faragha, kisha itazifuta kwa usalama; na (d) vifungu vya Masharti haya ambavyo kwa asili yake vinapaswa kuendelea vitaendelea kutumika, ikiwemo Vifungu vya 4, 5, 6, 7, 8, 12, na 13.",
  ],

  // 11
  "pages.terms.doc.11.01.h2": ["11. Third-Party Services", "11. Services tiers", "11. Huduma za Upande wa Tatu"],
  "pages.terms.doc.11.02.p": [
    "Our Services may integrate with or depend upon third-party platforms (including but not limited to Stripe, Google, Zoom, Anthropic, Resend, and others). These third-party services have their own terms of service and privacy policies, and your use of them is governed by those terms. TIBLOGICS is not responsible for the availability, accuracy, or practices of any third-party service.",
    "Nos Services peuvent s'intégrer à des plateformes tierces ou en dépendre (notamment, sans s'y limiter, Stripe, Google, Zoom, Anthropic, Resend et d'autres). Ces services tiers disposent de leurs propres conditions d'utilisation et politiques de confidentialité, qui régissent votre utilisation de ceux-ci. TIBLOGICS n'est pas responsable de la disponibilité, de l'exactitude ou des pratiques d'un service tiers.",
    "Huduma zetu zinaweza kuunganishwa na au kutegemea majukwaa ya upande wa tatu (ikiwemo lakini si tu Stripe, Google, Zoom, Anthropic, Resend, na mengineyo). Huduma hizi za upande wa tatu zina masharti yao ya huduma na sera zao za faragha, na matumizi yako ya huduma hizo yanasimamiwa na masharti hayo. TIBLOGICS haiwajibiki kwa upatikanaji, usahihi, au taratibu za huduma yoyote ya upande wa tatu.",
  ],

  // 12
  "pages.terms.doc.12.01.h2": [
    "12. Governing Law and Dispute Resolution",
    "12. Droit applicable et règlement des litiges",
    "12. Sheria Inayotumika na Utatuzi wa Migogoro",
  ],
  "pages.terms.doc.12.02.h3": ["12.1 Governing Law", "12.1 Droit applicable", "12.1 Sheria Inayotumika"],
  "pages.terms.doc.12.03.p": [
    "These Terms are governed by and construed in accordance with the laws of the State of Maryland, USA, without regard to its conflict of law principles. The United Nations Convention on Contracts for the International Sale of Goods does not apply.",
    "Les présentes Conditions sont régies et interprétées conformément aux lois de l'État du Maryland (États-Unis), sans égard à ses règles de conflit de lois. La Convention des Nations Unies sur les contrats de vente internationale de marchandises ne s'applique pas.",
    "Masharti haya yanasimamiwa na kufasiriwa kwa mujibu wa sheria za Jimbo la Maryland, Marekani, bila kuzingatia kanuni zake za mgongano wa sheria. Mkataba wa Umoja wa Mataifa kuhusu Mikataba ya Mauzo ya Kimataifa ya Bidhaa hautumiki.",
  ],
  "pages.terms.doc.12.04.h3": ["12.2 Informal Resolution", "12.2 Règlement amiable", "12.2 Utatuzi Usio Rasmi"],
  "pages.terms.doc.12.05.p": [
    `Before filing any formal claim, you agree to first contact TIBLOGICS at ${MAIL} and attempt to resolve the dispute informally. We will respond within 14 business days. If the dispute is not resolved within 30 days of your notice, either party may proceed to formal dispute resolution.`,
    `Avant d'engager toute procédure formelle, vous acceptez de contacter d'abord TIBLOGICS à l'adresse ${MAIL} et de tenter de régler le litige à l'amiable. Nous vous répondrons dans un délai de 14 jours ouvrés. Si le litige n'est pas résolu dans les 30 jours suivant votre notification, chaque partie peut engager une procédure formelle de règlement des litiges.`,
    `Kabla ya kuwasilisha dai lolote rasmi, unakubali kwanza kuwasiliana na TIBLOGICS kupitia ${MAIL} na kujaribu kutatua mgogoro kwa njia isiyo rasmi. Tutajibu ndani ya siku 14 za kazi. Ikiwa mgogoro hautatatuliwa ndani ya siku 30 tangu taarifa yako, upande wowote unaweza kuendelea na utatuzi rasmi wa mgogoro.`,
  ],
  "pages.terms.doc.12.06.h3": ["12.3 Binding Arbitration", "12.3 Arbitrage obligatoire", "12.3 Usuluhishi Unaofunga"],
  "pages.terms.doc.12.07.p": [
    "Any dispute, claim, or controversy arising out of or relating to these Terms or the Services that cannot be resolved informally shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules, with proceedings conducted in Montgomery County, Maryland, USA. The arbitrator's decision will be final and binding and may be entered as a judgment in any court of competent jurisdiction.",
    "Tout litige, réclamation ou différend découlant des présentes Conditions ou des Services, ou s'y rapportant, qui ne peut être résolu à l'amiable sera tranché par voie d'arbitrage obligatoire administré par l'American Arbitration Association (AAA) selon son règlement d'arbitrage commercial, la procédure se déroulant dans le comté de Montgomery, Maryland (États-Unis). La décision de l'arbitre sera définitive et contraignante et pourra être rendue exécutoire par toute juridiction compétente.",
    "Mgogoro, dai, au ubishani wowote unaotokana na au unaohusiana na Masharti haya au Huduma ambao hauwezi kutatuliwa kwa njia isiyo rasmi utatatuliwa kwa usuluhishi unaofunga unaosimamiwa na American Arbitration Association (AAA) chini ya Kanuni zake za Usuluhishi wa Kibiashara, na mashauri yatafanyika katika Kaunti ya Montgomery, Maryland, Marekani. Uamuzi wa msuluhishi utakuwa wa mwisho na unaofunga, na unaweza kusajiliwa kama hukumu katika mahakama yoyote yenye mamlaka.",
  ],
  "pages.terms.doc.12.08.h3": ["12.4 Class Action Waiver", "12.4 Renonciation aux actions collectives", "12.4 Kuacha Haki ya Kesi za Pamoja"],
  "pages.terms.doc.12.09.p": [
    "<strong>YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION AGAINST TIBLOGICS.</strong> All claims must be brought in an individual capacity only.",
    "<strong>VOUS RENONCEZ À TOUT DROIT DE PARTICIPER À UNE ACTION COLLECTIVE OU À UN ARBITRAGE COLLECTIF CONTRE TIBLOGICS.</strong> Toute réclamation doit être introduite exclusivement à titre individuel.",
    "<strong>UNAACHA HAKI YOYOTE YA KUSHIRIKI KATIKA KESI YA PAMOJA (CLASS ACTION) AU USULUHISHI WA PAMOJA DHIDI YA TIBLOGICS.</strong> Madai yote lazima yawasilishwe kwa nafasi ya mtu binafsi pekee.",
  ],
  "pages.terms.doc.12.10.h3": ["12.5 Exceptions", "12.5 Exceptions", "12.5 Vighairi"],
  "pages.terms.doc.12.11.p": [
    "Notwithstanding the above, either party may seek emergency injunctive or equitable relief in any court of competent jurisdiction to prevent irreparable harm, including to protect intellectual property rights or Confidential Information.",
    "Nonobstant ce qui précède, chaque partie peut solliciter en urgence une injonction ou toute autre mesure équitable devant toute juridiction compétente afin de prévenir un préjudice irréparable, notamment pour protéger des droits de propriété intellectuelle ou des Informations confidentielles.",
    "Licha ya yaliyoelezwa hapo juu, upande wowote unaweza kuomba amri ya dharura ya mahakama au nafuu nyingine ya haki katika mahakama yoyote yenye mamlaka ili kuzuia madhara yasiyoweza kurekebishwa, ikiwemo kulinda haki za mali ya kiakili au Taarifa za Siri.",
  ],

  // 13
  "pages.terms.doc.13.01.h2": ["13. General Provisions", "13. Dispositions générales", "13. Masharti ya Jumla"],
  "pages.terms.doc.13.02.h3": ["13.1 Entire Agreement", "13.1 Intégralité de l'accord", "13.1 Makubaliano Kamili"],
  "pages.terms.doc.13.03.p": [
    "These Terms, together with any applicable SOW, service agreement, or addendum, constitute the entire agreement between you and TIBLOGICS regarding the subject matter hereof and supersede all prior negotiations, representations, or agreements.",
    "Les présentes Conditions, ainsi que tout SOW, contrat de services ou avenant applicable, constituent l'intégralité de l'accord entre vous et TIBLOGICS concernant leur objet et remplacent l'ensemble des négociations, déclarations ou accords antérieurs.",
    "Masharti haya, pamoja na SOW, mkataba wa huduma, au nyongeza yoyote inayohusika, ndiyo makubaliano kamili kati yako na TIBLOGICS kuhusu jambo hili na yanachukua nafasi ya majadiliano, kauli, au makubaliano yote yaliyotangulia.",
  ],
  "pages.terms.doc.13.04.h3": ["13.2 Severability", "13.2 Divisibilité", "13.2 Utenganifu wa Vifungu"],
  "pages.terms.doc.13.05.p": [
    "If any provision of these Terms is found to be invalid, illegal, or unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.",
    "Si une disposition des présentes Conditions est jugée invalide, illégale ou inapplicable, elle sera modifiée dans la mesure minimale nécessaire pour la rendre applicable, et les autres dispositions conserveront leur plein effet.",
    "Ikiwa kifungu chochote cha Masharti haya kitaonekana kuwa batili, kinyume cha sheria, au hakitekelezeki, kifungu hicho kitarekebishwa kwa kiwango cha chini kabisa kinachohitajika ili kiweze kutekelezeka, na vifungu vilivyobaki vitaendelea kuwa na nguvu kamili.",
  ],
  "pages.terms.doc.13.06.h3": ["13.3 Waiver", "13.3 Renonciation", "13.3 Kuacha Haki"],
  "pages.terms.doc.13.07.p": [
    "Our failure to enforce any provision of these Terms does not constitute a waiver of our right to enforce that provision in the future.",
    "Le fait que nous n'appliquions pas une disposition des présentes Conditions ne vaut pas renonciation à notre droit de l'appliquer à l'avenir.",
    "Kushindwa kwetu kutekeleza kifungu chochote cha Masharti haya hakumaanishi kwamba tumeacha haki yetu ya kukitekeleza siku zijazo.",
  ],
  "pages.terms.doc.13.08.h3": ["13.4 Assignment", "13.4 Cession", "13.4 Uhamisho wa Haki"],
  "pages.terms.doc.13.09.p": [
    "You may not assign or transfer your rights or obligations under these Terms without our prior written consent. TIBLOGICS may assign these Terms freely, including in connection with a merger, acquisition, or sale of assets.",
    "Vous ne pouvez céder ni transférer vos droits ou obligations au titre des présentes Conditions sans notre accord écrit préalable. TIBLOGICS peut céder librement les présentes Conditions, notamment dans le cadre d'une fusion, d'une acquisition ou d'une cession d'actifs.",
    "Huwezi kukabidhi wala kuhamisha haki au wajibu wako chini ya Masharti haya bila idhini yetu ya maandishi iliyotolewa mapema. TIBLOGICS inaweza kukabidhi Masharti haya kwa uhuru, ikiwemo kuhusiana na muungano, ununuzi, au mauzo ya mali.",
  ],
  "pages.terms.doc.13.10.h3": ["13.5 Force Majeure", "13.5 Force majeure", "13.5 Nguvu Isiyozuilika"],
  "pages.terms.doc.13.11.p": [
    "TIBLOGICS will not be liable for any delay or failure to perform its obligations resulting from causes beyond its reasonable control, including acts of God, natural disasters, war, terrorism, civil unrest, government action, labour disputes, or failure of third-party infrastructure or services.",
    "TIBLOGICS ne pourra être tenue responsable d'un retard ou d'un manquement dans l'exécution de ses obligations résultant de causes échappant à son contrôle raisonnable, notamment les cas fortuits, catastrophes naturelles, guerres, actes de terrorisme, troubles civils, actions gouvernementales, conflits sociaux ou défaillances d'infrastructures ou de services tiers.",
    "TIBLOGICS haitawajibika kwa ucheleweshaji wowote au kushindwa kutimiza wajibu wake kunakotokana na sababu zilizo nje ya uwezo wake wa kawaida wa kudhibiti, ikiwemo matukio ya asili, majanga ya asili, vita, ugaidi, machafuko ya kiraia, hatua za serikali, migogoro ya wafanyakazi, au kushindwa kwa miundombinu au huduma za upande wa tatu.",
  ],
  "pages.terms.doc.13.12.h3": ["13.6 Updates to These Terms", "13.6 Mises à jour des présentes Conditions", "13.6 Masasisho ya Masharti Haya"],
  "pages.terms.doc.13.13.p": [
    "We reserve the right to modify these Terms at any time. Material changes will be communicated via the Site or email. Continued use of the Services after the effective date of any changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.",
    "Nous nous réservons le droit de modifier les présentes Conditions à tout moment. Les modifications importantes seront communiquées sur le Site ou par e-mail. Le fait de continuer à utiliser les Services après la date d'entrée en vigueur d'une modification vaut acceptation des Conditions révisées. Nous vous invitons à consulter régulièrement les présentes Conditions.",
    "Tuna haki ya kubadilisha Masharti haya wakati wowote. Mabadiliko makubwa yatatangazwa kupitia Tovuti au email. Kuendelea kutumia Huduma baada ya tarehe ya kuanza kutumika kwa mabadiliko yoyote kunamaanisha kwamba umekubali Masharti yaliyorekebishwa. Tunakuhimiza upitie Masharti haya mara kwa mara.",
  ],
  "pages.terms.doc.13.14.h3": ["13.7 Electronic Communications", "13.7 Communications électroniques", "13.7 Mawasiliano ya Kielektroniki"],
  "pages.terms.doc.13.15.p": [
    "By using our Services, you consent to receive electronic communications from TIBLOGICS. You agree that electronic communications satisfy any legal requirement that communications be in writing.",
    "En utilisant nos Services, vous acceptez de recevoir des communications électroniques de la part de TIBLOGICS. Vous reconnaissez que les communications électroniques satisfont à toute exigence légale imposant qu'une communication soit faite par écrit.",
    "Kwa kutumia Huduma zetu, unakubali kupokea mawasiliano ya kielektroniki kutoka TIBLOGICS. Unakubali kwamba mawasiliano ya kielektroniki yanatimiza matakwa yoyote ya kisheria yanayotaka mawasiliano yawe kwa maandishi.",
  ],

  // 14
  "pages.terms.doc.14.01.h2": ["14. Contact", "14. Contact", "14. Mawasiliano"],
  "pages.terms.doc.14.02.contact": [
    "Questions about these Terms? Contact us:",
    "Des questions sur les présentes Conditions ? Contactez-nous :",
    "Una maswali kuhusu Masharti haya? Wasiliana nasi:",
  ],
});
