import { getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/client";
import { areaMessages, type MessageArea } from "@/lib/i18n/client-messages";

/**
 * Adds an area's messages (lib/i18n/client-messages.ts) to the core ones the
 * root layout sends, for the client components below it.
 */
export default async function ClientMessages({ area, children }: { area: MessageArea | MessageArea[]; children: React.ReactNode }) {
  const locale = await getLocale();
  const areas = Array.isArray(area) ? area : [area];
  const dict = areas.length === 1 ? areaMessages(locale, areas[0]) : Object.assign({}, ...areas.map((a) => areaMessages(locale, a)));
  return (
    <I18nProvider locale={locale} dict={dict} loaded={areas}>
      {children}
    </I18nProvider>
  );
}
