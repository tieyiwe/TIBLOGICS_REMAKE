import type { CardBrand } from "./og-card";
import { TRACK_BASE_PRICE_CENTS } from "@/lib/learn/pricing";

// Share previews that sell the click (WhatsApp, LinkedIn, X, Facebook,
// iMessage, Slack). For each key page: a hook headline, one line of benefit,
// up to three selling points, an optional big number and the button. They
// replace the page's plain title card (lib/seo/meta.ts) and its og:title and
// og:description. Dynamic pages (tracks, products, scan reports) build their
// own promo from their data. French when the page is shown in French;
// everything else (crawlers included) gets English.

export interface Promo {
  title: string;
  description: string;
  cta: string;
  stat?: string;
  statLabel?: string;
  chips?: string[];
  kicker?: string;
  brand?: CardBrand;
  /** A picture from /public beside the text (product covers). */
  image?: string;
}

type Pair = { en: Promo; fr: Promo };

const from = `$${Math.round(TRACK_BASE_PRICE_CENTS / 100)}`;

const PROMOS: Record<string, Pair> = {
  "/services": {
    en: { title: "AI that does the work, not just the talking", description: "AI agents, automation and full-stack builds that save your team hours every week.", chips: ["Free 30-min call", "Clear fixed quotes", "English · French"], cta: "Book a free call →", kicker: "Services" },
    fr: { title: "Une IA qui travaille, pas qui bavarde", description: "Agents IA, automatisation et applications sur mesure qui font gagner des heures à votre équipe.", chips: ["Appel gratuit 30 min", "Devis clairs", "Français · anglais"], cta: "Réserver un appel →", kicker: "Services" },
  },
  "/tools": {
    en: { title: "Free AI tools for your business", description: "Score your website, price an AI product and get a plan, in minutes.", chips: ["Website scanner", "AI cost calculator", "No sign-up"], cta: "Try them free →", kicker: "Free AI tools" },
    fr: { title: "Des outils IA gratuits pour votre entreprise", description: "Notez votre site, chiffrez un produit IA et obtenez un plan, en quelques minutes.", chips: ["Analyse de site", "Calculateur IA", "Sans inscription"], cta: "Essayer gratuitement →", kicker: "Outils IA gratuits" },
  },
  "/tools/scanner": {
    en: { title: "How does your website score?", description: "Free scan of your SEO, speed, security, AI readiness and lead capture.", stat: "?/100", statLabel: "Your score", chips: ["Free", "30 seconds", "No sign-up"], cta: "Scan my site →", kicker: "Website scanner" },
    fr: { title: "Quelle note pour votre site ?", description: "Analyse gratuite : référencement, vitesse, sécurité, maturité IA et prospects.", stat: "?/100", statLabel: "Votre note", chips: ["Gratuit", "30 secondes", "Sans inscription"], cta: "Analyser mon site →", kicker: "Analyse de site" },
  },
  "/tools/calculator": {
    en: { title: "What will your AI product really cost?", description: "Model, hosting and build costs in one estimate, before you spend a dollar.", chips: ["Free", "Real model prices", "Instant estimate"], cta: "Calculate my cost →", kicker: "AI cost calculator" },
    fr: { title: "Combien coûtera vraiment votre produit IA ?", description: "Modèles, hébergement et développement en une estimation, avant de dépenser un dollar.", chips: ["Gratuit", "Prix réels", "Estimation immédiate"], cta: "Calculer mon coût →", kicker: "Calculateur IA" },
  },
  "/tools/readiness-monitor": {
    en: { title: "Are your competitors ahead on AI?", description: "Weekly scans of your site and up to three competitors, with an alert when something changes.", chips: ["Weekly scans", "3 competitors", "Email alerts"], cta: "Start monitoring →", kicker: "Readiness Monitor" },
    fr: { title: "Vos concurrents ont-ils une longueur d'avance ?", description: "Analyse hebdomadaire de votre site et de trois concurrents, avec une alerte à chaque changement.", chips: ["Chaque semaine", "3 concurrents", "Alertes e-mail"], cta: "Lancer le suivi →", kicker: "Readiness Monitor" },
  },
  "/tools/automation-blueprint": {
    en: { title: "Get hours back every week", description: "A written plan to automate up to three of your repetitive tasks, tools and roadmap included.", chips: ["3 processes", "Week-by-week plan", "Credited if we build"], cta: "Get my blueprint →", kicker: "Automation Blueprint" },
    fr: { title: "Récupérez des heures chaque semaine", description: "Un plan écrit pour automatiser jusqu'à trois tâches répétitives, outils et feuille de route compris.", chips: ["3 processus", "Plan semaine par semaine", "Déduit si on le réalise"], cta: "Obtenir mon plan →", kicker: "Automation Blueprint" },
  },
  "/learning-box": {
    en: { title: "Learn AI by doing. Earn a certificate.", description: "Self-paced AI courses with video lessons, hands-on labs and verifiable certificates.", stat: from, statLabel: "from, lifetime access", chips: ["Hands-on labs", "Certificate", "English · French"], cta: "Explore the courses →", kicker: "AI Academy", brand: "arfa" },
    fr: { title: "Apprenez l'IA en pratiquant. Obtenez un certificat.", description: "Cours d'IA à votre rythme : vidéos, ateliers pratiques et certificats vérifiables.", stat: from, statLabel: "dès, accès à vie", chips: ["Ateliers pratiques", "Certificat", "Français · anglais"], cta: "Voir les parcours →", kicker: "Académie IA", brand: "arfa" },
  },
  "/learning-box/join": {
    en: { title: "Start learning AI today", description: "Choose a course, create your account and start in minutes.", stat: from, statLabel: "from, lifetime access", chips: ["Video lessons", "Labs", "Certificate"], cta: "Join ARFA →", kicker: "AI Academy", brand: "arfa" },
    fr: { title: "Commencez l'IA aujourd'hui", description: "Choisissez un parcours, créez votre compte et commencez en quelques minutes.", stat: from, statLabel: "dès, accès à vie", chips: ["Vidéos", "Ateliers", "Certificat"], cta: "Rejoindre ARFA →", kicker: "Académie IA", brand: "arfa" },
  },
  "/learning-box/glossary": {
    en: { title: "AI jargon, explained simply", description: "LLM, token, RAG, agents and more: every AI term in plain language.", stat: "139", statLabel: "AI terms", chips: ["Plain language", "English · French", "Free"], cta: "Look it up →", kicker: "AI glossary", brand: "arfa" },
    fr: { title: "Le jargon de l'IA, expliqué simplement", description: "LLM, token, RAG, agents… chaque terme de l'IA en langage clair.", stat: "139", statLabel: "termes de l'IA", chips: ["Langage clair", "Français · anglais", "Gratuit"], cta: "Chercher un terme →", kicker: "Glossaire de l'IA", brand: "arfa" },
  },
  "/tilo-vision-scholarship": {
    en: { title: "Win a scholarship to learn AI", description: "The Tilo Vision Scholarship covers up to 100% of an ARFA AI course.", stat: "100%", statLabel: "covered, up to", chips: ["Certificate course", "Learn at your pace", "Apply in 5 minutes"], cta: "Apply now →", kicker: "Scholarship", brand: "arfa" },
    fr: { title: "Gagnez une bourse pour apprendre l'IA", description: "La bourse Tilo Vision finance jusqu'à 100 % d'un parcours IA ARFA.", stat: "100 %", statLabel: "financé, jusqu'à", chips: ["Parcours certifiant", "À votre rythme", "5 minutes pour postuler"], cta: "Postuler →", kicker: "Bourse", brand: "arfa" },
  },
  "/store": {
    en: { title: "Ready-made AI toolkits for your business", description: "Prompt packs and playbooks you can use today. Instant download.", chips: ["Instant download", "Ready to use", "Made by experts"], cta: "Browse the store →", kicker: "Store" },
    fr: { title: "Des boîtes à outils IA prêtes à l'emploi", description: "Packs de prompts et guides utilisables dès aujourd'hui. Téléchargement immédiat.", chips: ["Téléchargement immédiat", "Prêt à l'emploi", "Conçu par des experts"], cta: "Voir la boutique →", kicker: "Boutique" },
  },
  "/book": {
    en: { title: "Talk to an AI expert, free", description: "Your business, your questions, and a clear next step at the end of the call.", stat: "30", statLabel: "minutes, free", chips: ["No obligation", "English · French", "Pick your time"], cta: "Pick a time →", kicker: "Free consultation" },
    fr: { title: "Parlez à un expert IA, gratuitement", description: "Votre activité, vos questions, et une prochaine étape claire à la fin de l'appel.", stat: "30", statLabel: "minutes, gratuit", chips: ["Sans engagement", "Français · anglais", "Choisissez l'heure"], cta: "Choisir un créneau →", kicker: "Consultation gratuite" },
  },
  "/ai-times": {
    en: { title: "AI news in plain language", description: "Short reads on AI for business and frontier tech, without the hype.", stat: "5", statLabel: "minute reads", chips: ["Business AI", "Frontier tech", "English · French"], cta: "Read today's story →", kicker: "AI Times" },
    fr: { title: "L'actualité de l'IA en langage clair", description: "Des lectures courtes sur l'IA en entreprise et les technologies de pointe, sans le battage.", stat: "5", statLabel: "minutes de lecture", chips: ["IA en entreprise", "Technologies de pointe", "Français · anglais"], cta: "Lire l'article du jour →", kicker: "AI Times" },
  },
  "/events": {
    en: { title: "AI events and hands-on training", description: "Workshops and talks that leave your team ready to use AI on Monday.", chips: ["Live sessions", "Hands-on", "Teams welcome"], cta: "See what's on →", kicker: "Events & training" },
    fr: { title: "Événements et formations IA pratiques", description: "Ateliers et conférences pour que votre équipe utilise l'IA dès lundi.", chips: ["En direct", "Pratique", "Pour les équipes"], cta: "Voir le programme →", kicker: "Événements" },
  },
  "/about": {
    en: { title: "We build what makes your business faster", description: "An AI-first agency for the United States and Africa: strategy, builds and training.", chips: ["AI agents", "Automation", "Full-stack builds"], cta: "Meet TIBLOGICS →", kicker: "About" },
    fr: { title: "Nous construisons ce qui accélère votre entreprise", description: "Une agence IA pour les États-Unis et l'Afrique : stratégie, développement et formation.", chips: ["Agents IA", "Automatisation", "Applications"], cta: "Découvrir TIBLOGICS →", kicker: "À propos" },
  },
  "/contact": {
    en: { title: "Tell us what you want to build", description: "A real person replies within one business day.", chips: ["Free first call", "Clear quote", "English · French"], cta: "Start the conversation →", kicker: "Contact" },
    fr: { title: "Dites-nous ce que vous voulez construire", description: "Une vraie personne vous répond sous un jour ouvré.", chips: ["Premier appel gratuit", "Devis clair", "Français · anglais"], cta: "Démarrer la conversation →", kicker: "Contact" },
  },
  "/products": {
    en: { title: "AI products built for real businesses", description: "Learning, care, shipping and security products from TIBLOGICS.", chips: ["Live products", "Built in-house", "Ready to deploy"], cta: "See the products →", kicker: "Products" },
    fr: { title: "Des produits IA pour de vraies entreprises", description: "Éducation, santé, logistique et sécurité : les produits TIBLOGICS.", chips: ["Produits en ligne", "Conçus en interne", "Prêts à déployer"], cta: "Voir les produits →", kicker: "Produits" },
  },
};

/** The hand-written promo for a page, in its language. */
export function promoFor(path: string, locale?: string | null): Promo | null {
  const p = PROMOS[path.split("?")[0].replace(/\/$/, "") || "/"];
  if (!p) return null;
  return locale === "fr" ? p.fr : p.en;
}

/** Money for a card: "$1,200", "$29". */
export function cardMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: cents % 100 ? 2 : 0 })}`;
}
