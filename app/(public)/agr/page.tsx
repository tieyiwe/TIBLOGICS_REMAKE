import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo/meta";
import { SITE_URL } from "@/lib/seo/site";
import SendToComputer from "@/components/agr/SendToComputer";
import { Download } from "lucide-react";

// The AI Graveyard Report (AGR Score™) skill, by Tieyiwe Bassole: the page a
// QR code leads to. It offers the skill as a .zip to add to Claude and says
// how to install and run it. Only the zip is offered: the prompt itself is
// not published on the page. The file: public/downloads/.

const ZIP = "/downloads/agr-score-auth-tieyiwe-b.zip";
const COMMAND = "/agr-score-auth-tieyiwe-b";

const COPY = {
  en: {
    metaTitle: "AI Graveyard Report (AGR Score™): download the Claude skill",
    metaDesc: "How many of your AI projects did you actually finish? Add the AGR Score skill to Claude and get your score from 0 to 100.",
    eyebrow: "Claude skill · Free",
    title: "AI Graveyard Report",
    sub: "How many of your AI projects did you actually finish? The AGR Score™ audits your past AI chats, finds your real projects and scores your follow-through from 0 to 100.",
    download: "Download the skill (.zip)",
    size: "Free · 15 KB · for Claude",
    send: "Send this page to my computer",
    copied: "Link copied",
    phone: "On a phone? Download now, or send yourself the link: skills are added to Claude from a computer.",
    aboutTitle: "What is the AGR Score?",
    about: [
      "AI makes starting easy. In one chat you can plan an app, a course, a business or a book. Most of those plans never leave the chat. That pile of started and abandoned ideas is your AI graveyard.",
      "The AI Graveyard Report looks back over up to two years of your AI chats. It keeps only real projects (work that needs effort outside the chat), groups the chats about the same idea, and records the facts: when you started, how often you came back, and whether anything was shared, tested, launched or delivered.",
      "A fixed formula turns those facts into a score for each project and one AGR Score from 0 to 100. The same chats on the same date always give the same score: no guesswork and no flattery. Then you tell Claude what happened to each project, the report updates, and you re-run it every 30 days to see your follow-through improve.",
    ],
    tiersTitle: "The five tiers",
    howTitle: "Install in 3 steps",
    steps: [
      ["Download the zip", "Keep it as it is. Do not unzip it."],
      ["Add it to Claude", "On claude.ai or the Claude desktop app: Settings, then Capabilities, then Skills, then Upload skill. Choose the zip. If you do not see Skills, turn on code execution on the same page."],
      ["Run it", `Start a new chat and type ${COMMAND}, or simply ask "What is my AGR Score?"`],
    ],
    getTitle: "What you get",
    get: [
      "Your AGR Score from 0 to 100 and your tier, from Cemetery Owner to Shipper",
      "Every real project sorted into Shipped, Alive, Stalled or Buried, with its own score",
      "Your follow-through rate, restart rate and how long ideas sit idle",
      "The three projects worth reviving first, and a habit to keep until your next report",
      "A version you can share, with your project names hidden",
    ],
    privacyTitle: "Private by design",
    privacy: "The skill runs inside your own Claude account. TIBLOGICS never receives your chats or your report.",
    privacyLink: "AGR Score privacy policy",
    by: "Created by Tieyiwe Bassole, Founder of TIBLOGICS.",
    arfa: "Want to finish more of what you start with AI? Learn with ARFA, the TIBLOGICS AI Academy.",
    arfaCta: "Explore ARFA",
  },
  fr: {
    metaTitle: "AI Graveyard Report (AGR Score™) : télécharger le skill Claude",
    metaDesc: "Combien de vos projets IA avez-vous vraiment terminés ? Ajoutez le skill AGR Score à Claude et obtenez votre score de 0 à 100.",
    eyebrow: "Skill Claude · Gratuit",
    title: "AI Graveyard Report",
    sub: "Combien de vos projets IA avez-vous vraiment terminés ? L'AGR Score™ analyse vos anciennes conversations IA, retrouve vos vrais projets et note votre capacité à aller au bout, de 0 à 100.",
    download: "Télécharger le skill (.zip)",
    size: "Gratuit · 15 Ko · pour Claude",
    send: "Envoyer cette page vers mon ordinateur",
    copied: "Lien copié",
    phone: "Sur téléphone ? Téléchargez maintenant ou envoyez-vous le lien : les skills s'ajoutent à Claude depuis un ordinateur.",
    aboutTitle: "Qu'est-ce que l'AGR Score ?",
    about: [
      "L'IA rend le démarrage facile. En une conversation, vous planifiez une application, une formation, une entreprise ou un livre. La plupart de ces plans ne quittent jamais la conversation. Cette pile d'idées commencées puis abandonnées, c'est votre cimetière IA.",
      "L'AI Graveyard Report remonte jusqu'à deux ans de vos conversations IA. Il ne garde que les vrais projets (ceux qui demandent du travail hors de la conversation), regroupe les conversations sur une même idée et relève les faits : quand vous avez commencé, combien de fois vous y êtes revenu, et si quelque chose a été partagé, testé, lancé ou livré.",
      "Une formule fixe transforme ces faits en un score par projet et un AGR Score global de 0 à 100. Les mêmes conversations à la même date donnent toujours le même score : ni approximation ni flatterie. Vous dites ensuite à Claude où en est chaque projet, le rapport se met à jour, et vous le relancez tous les 30 jours pour voir votre capacité à finir progresser.",
    ],
    tiersTitle: "Les cinq niveaux",
    howTitle: "Installation en 3 étapes",
    steps: [
      ["Téléchargez le zip", "Gardez-le tel quel, sans le décompresser."],
      ["Ajoutez-le à Claude", "Sur claude.ai ou l'application Claude pour ordinateur : Paramètres, puis Capacités, puis Skills, puis Importer un skill. Choisissez le zip. Si Skills n'apparaît pas, activez l'exécution de code sur la même page."],
      ["Lancez-le", `Ouvrez une nouvelle conversation et tapez ${COMMAND}, ou demandez simplement « Quel est mon AGR Score ? »`],
    ],
    getTitle: "Ce que vous obtenez",
    get: [
      "Votre AGR Score de 0 à 100 et votre niveau, de Cemetery Owner à Shipper",
      "Chaque vrai projet classé Shipped, Alive, Stalled ou Buried, avec son propre score",
      "Votre taux de finalisation, de relance et le temps pendant lequel vos idées dorment",
      "Les trois projets à relancer en priorité, et une habitude à garder jusqu'au prochain rapport",
      "Une version à partager, avec les noms de vos projets masqués",
    ],
    privacyTitle: "Privé par conception",
    privacy: "Le skill fonctionne dans votre propre compte Claude. TIBLOGICS ne reçoit jamais vos conversations ni votre rapport.",
    privacyLink: "Politique de confidentialité de l'AGR Score",
    by: "Créé par Tieyiwe Bassole, fondateur de TIBLOGICS.",
    arfa: "Envie de terminer davantage de projets avec l'IA ? Formez-vous avec ARFA, l'académie IA de TIBLOGICS.",
    arfaCta: "Découvrir ARFA",
  },
  sw: {
    metaTitle: "AI Graveyard Report (AGR Score™): pakua skill ya Claude",
    metaDesc: "Ni miradi mingapi ya AI uliyomaliza kweli? Ongeza skill ya AGR Score kwenye Claude upate alama yako kutoka 0 hadi 100.",
    eyebrow: "Skill ya Claude · Bure",
    title: "AI Graveyard Report",
    sub: "Ni miradi mingapi ya AI uliyomaliza kweli? AGR Score™ inakagua mazungumzo yako ya zamani ya AI, inapata miradi yako halisi na kupima uwezo wako wa kumaliza, kutoka 0 hadi 100.",
    download: "Pakua skill (.zip)",
    size: "Bure · 15 KB · kwa Claude",
    send: "Tuma ukurasa huu kwenye kompyuta yangu",
    copied: "Kiungo kimenakiliwa",
    phone: "Uko kwenye simu? Pakua sasa, au jitumie kiungo: skills huongezwa kwenye Claude kutoka kwenye kompyuta.",
    aboutTitle: "AGR Score ni nini?",
    about: [
      "AI inafanya kuanza kuwa rahisi. Katika mazungumzo moja unaweza kupanga programu, kozi, biashara au kitabu. Mipango mingi kati ya hiyo haitoki kwenye mazungumzo. Rundo hilo la mawazo yaliyoanzishwa na kuachwa ndilo makaburi yako ya AI.",
      "AI Graveyard Report inaangalia hadi miaka miwili ya mazungumzo yako ya AI. Inabaki na miradi halisi tu (kazi inayohitaji juhudi nje ya mazungumzo), inaunganisha mazungumzo ya wazo moja, na kurekodi ukweli: ulianza lini, ulirudi mara ngapi, na kama kuna kitu kilishirikiwa, kilijaribiwa, kilizinduliwa au kiliwasilishwa.",
      "Fomula isiyobadilika inageuza ukweli huo kuwa alama ya kila mradi na AGR Score moja kutoka 0 hadi 100. Mazungumzo yale yale siku ile ile hutoa alama ile ile: hakuna kubahatisha wala kubembeleza. Kisha unamwambia Claude kilichotokea kwa kila mradi, ripoti inasasishwa, na unairudia kila siku 30 kuona maendeleo yako ya kumaliza.",
    ],
    tiersTitle: "Viwango vitano",
    howTitle: "Sakinisha kwa hatua 3",
    steps: [
      ["Pakua zip", "Iache kama ilivyo, usiifungue."],
      ["Iongeze kwenye Claude", "Kwenye claude.ai au programu ya Claude ya kompyuta: Settings, kisha Capabilities, kisha Skills, kisha Upload skill. Chagua zip. Usipoona Skills, washa code execution kwenye ukurasa huo huo."],
      ["Iendeshe", `Anza mazungumzo mapya na uandike ${COMMAND}, au uliza tu "AGR Score yangu ni ipi?"`],
    ],
    getTitle: "Unachopata",
    get: [
      "AGR Score yako kutoka 0 hadi 100 na kiwango chako, kutoka Cemetery Owner hadi Shipper",
      "Kila mradi halisi umepangwa kama Shipped, Alive, Stalled au Buried, na alama yake",
      "Kiwango chako cha kumaliza, cha kuanza upya na muda mawazo yanakaa bila kuguswa",
      "Miradi mitatu ya kufufua kwanza, na tabia ya kushika hadi ripoti inayofuata",
      "Toleo la kushiriki, majina ya miradi yako yakiwa yamefichwa",
    ],
    privacyTitle: "Faragha tangu mwanzo",
    privacy: "Skill inaendeshwa ndani ya akaunti yako ya Claude. TIBLOGICS haipokei kamwe mazungumzo yako wala ripoti yako.",
    privacyLink: "Sera ya faragha ya AGR Score",
    by: "Imeundwa na Tieyiwe Bassole, mwanzilishi wa TIBLOGICS.",
    arfa: "Unataka kumaliza zaidi ya unachoanza ukitumia AI? Jifunze na ARFA, akademia ya AI ya TIBLOGICS.",
    arfaCta: "Gundua ARFA",
  },
} as const;

const TIERS: Array<[string, string]> = [
  ["Shipper", "80-100"],
  ["Steady Builder", "60-79"],
  ["Sparks and Embers", "40-59"],
  ["Graveyard Keeper", "20-39"],
  ["Cemetery Owner", "0-19"],
];

const copyFor = (locale: string) => COPY[(locale in COPY ? locale : "en") as keyof typeof COPY];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = copyFor(locale);
  return pageMetadata({ path: "/agr", locale, title: c.metaTitle, description: c.metaDesc });
}

export default async function AgrPage() {
  const locale = await getLocale();
  const c = copyFor(locale);

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      {/* Hero: the download first, for people arriving from a QR code. */}
      <section className="bg-[#0D1B2A] px-4 pb-12 pt-28 text-white sm:pb-16 sm:pt-40">
        <div className="mx-auto max-w-3xl">
          <p className="font-dm text-xs font-bold uppercase tracking-[0.2em] text-[#F9A738]">{c.eyebrow}</p>
          <h1 className="mt-3 font-syne text-5xl font-extrabold leading-none tracking-tight sm:text-7xl">
            AGR Score<span className="align-super text-2xl text-[#F9A738] sm:text-3xl">™</span>
          </h1>
          <p className="mt-3 font-syne text-xl font-bold text-[#F9A738] sm:text-2xl">{c.title}</p>
          <p className="mt-4 max-w-2xl font-dm text-base leading-relaxed text-white/75 sm:text-lg">{c.sub}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <DownloadButton label={c.download} meta={c.size} track="agr-download-zip" testId="agr-download" />
            <SendToComputer label={c.send} copied={c.copied} url={`${SITE_URL}/agr`} />
          </div>
          <p className="mt-4 max-w-xl font-dm text-sm leading-relaxed text-white/70 sm:hidden">{c.phone}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:py-14">
        {/* About the AGR Score */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-about" data-testid="agr-about">
          <h2 id="agr-about" className="font-syne text-2xl font-bold text-[#0D1B2A]">{c.aboutTitle}</h2>
          <div className="mt-4 space-y-4">
            {c.about.map((para) => (
              <p key={para.slice(0, 40)} className="font-dm text-[15px] leading-relaxed text-[#3A4A5C]">{para}</p>
            ))}
          </div>
          <p className="mt-6 font-dm text-xs font-bold uppercase tracking-[0.15em] text-[#7A8FA6]">{c.tiersTitle}</p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-5">
            {TIERS.map(([name, range], i) => (
              <li
                key={name}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 font-dm text-sm sm:flex-col sm:items-start sm:justify-start"
                style={{ background: ["#DCFCE7", "#DBEAFE", "#FEF3C7", "#FFEDD5", "#FEE2E2"][i] }}
              >
                <span className="font-bold text-[#0D1B2A]">{name}</span>
                <span className="text-xs font-semibold text-[#3A4A5C]">{range}</span>
              </li>
            ))}
          </ol>
        </section>
        {/* Install */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-how">
          <h2 id="agr-how" className="font-syne text-2xl font-bold text-[#0D1B2A]">{c.howTitle}</h2>
          <ol className="mt-6 space-y-5">
            {c.steps.map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F47C20] font-dm text-base font-bold text-white">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-dm text-base font-bold text-[#0D1B2A]">{title}</p>
                  <p className="mt-1 break-words font-dm text-sm leading-relaxed text-[#3A4A5C]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What you get */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-get">
          <h2 id="agr-get" className="font-syne text-2xl font-bold text-[#0D1B2A]">{c.getTitle}</h2>
          <ul className="mt-5 space-y-3">
            {c.get.map((g) => (
              <li key={g} className="flex gap-3 font-dm text-sm leading-relaxed text-[#3A4A5C]">
                <span aria-hidden="true" className="mt-0.5 font-bold text-[#15803D]">✓</span>
                {g}
              </li>
            ))}
          </ul>
        </section>

        {/* Privacy */}
        <section className="rounded-2xl border border-[#D2DCE8] bg-white p-6 sm:p-8" aria-labelledby="agr-privacy">
          <h2 id="agr-privacy" className="font-syne text-xl font-bold text-[#0D1B2A]">{c.privacyTitle}</h2>
          <p className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{c.privacy}</p>
          <Link href="/privacy/agr" className="mt-3 inline-block font-dm text-sm font-bold text-[#2251A3] underline-offset-2 hover:underline">
            {c.privacyLink}
          </Link>
        </section>

        {/* Second download, after reading */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#0D1B2A] p-6 text-center sm:p-8">
          <DownloadButton label={c.download} meta={c.size} track="agr-download-zip-bottom" />
          <p className="font-dm text-xs text-white/60">{c.by}</p>
        </div>

        <p className="text-center font-dm text-sm text-[#3A4A5C]">
          {c.arfa}{" "}
          <Link href="/learning-box" className="font-bold text-[#2251A3] underline-offset-2 hover:underline">
            {c.arfaCta} →
          </Link>
        </p>
      </div>
    </div>
  );
}

/** The download: one big, friendly button (icon, label, and size underneath). */
function DownloadButton({ label, meta, track, testId }: { label: string; meta: string; track: string; testId?: string }) {
  return (
    <a
      href={ZIP}
      download
      data-track={track}
      {...(testId ? { "data-testid": testId } : {})}
      className="group inline-flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#F47C20] to-[#F9A738] px-5 py-4 text-left text-white shadow-[0_12px_32px_-8px_rgba(244,124,32,0.65)] ring-1 ring-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-8px_rgba(244,124,32,0.8)] active:translate-y-0 sm:w-auto sm:pr-8"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 transition-transform duration-200 group-hover:translate-y-0.5">
        <Download size={24} strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block font-dm text-lg font-extrabold leading-tight">{label}</span>
        <span className="mt-0.5 block font-dm text-xs font-semibold text-white/85">{meta}</span>
      </span>
    </a>
  );
}
