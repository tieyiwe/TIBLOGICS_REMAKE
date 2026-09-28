import { NextRequest, NextResponse } from "next/server";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { localizedPrompt } from "@/lib/i18n/sources/toolkit";

// One prompt's full text, for subscribers whose plan includes the library, in
// the visitor's language. `pending: true` means it is the English version
// because its category is still being translated; its fields then match the
// English text, and the client says so when it asks for a draft.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireToolkit({ generate: true });
  if (gate.error) return gate.error;
  const locale = await getLocale();
  const found = await localizedPrompt((await params).id, locale);
  if (!found) return NextResponse.json({ error: translatorFor(locale)("toolkit.api.notFound") }, { status: 404 });
  return NextResponse.json({ prompt: found.prompt, pending: found.pending });
}
