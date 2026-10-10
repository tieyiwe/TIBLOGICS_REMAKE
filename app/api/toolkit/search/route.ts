import { NextRequest, NextResponse } from "next/server";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchPrompts } from "@/lib/toolkit/search";
import { LIBRARY_VERTICALS, type LibraryPrompt } from "@/lib/toolkit/library";
import { categoryKey } from "@/lib/toolkit/labels";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizedLibrary } from "@/lib/i18n/sources/toolkit";

// Keyword search across the prompt library, including the prompt text, which
// is why it runs on the server for subscribers rather than in the browser.
// In French and Swahili it searches the translated text as well as the
// English, and returns titles in the visitor's language where available.
export async function GET(req: NextRequest) {
  const gate = await requireToolkit({ generate: true });
  if (gate.error) return gate.error;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`toolkit-search:${gate.access.student.id}`, 120, 60_000))) {
    return NextResponse.json({ error: t("toolkit.api.tooManySearches") }, { status: 429 });
  }
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").slice(0, 200);
  const vertical = sp.get("vertical");
  const scope = vertical && LIBRARY_VERTICALS.some((v) => v.id === vertical) ? vertical : undefined;
  if (locale === "en") return NextResponse.json(searchPrompts(q, { vertical: scope }));
  const library = await localizedLibrary(locale);
  const translations = new Map<string, LibraryPrompt>();
  for (const id of library.translatedIds) translations.set(id, library.byId.get(id)!);
  return NextResponse.json(
    searchPrompts(q, { vertical: scope, locale, translations, categoryLabel: (c) => t(categoryKey(c)) }),
  );
}
