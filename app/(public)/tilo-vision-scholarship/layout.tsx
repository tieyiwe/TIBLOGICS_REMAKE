import ClientMessages from "@/components/i18n/ClientMessages";

// Client texts for this area (lib/i18n/client-messages.ts): the form's "learn.scholarApply.*".
export default function ScholarshipPublicLayout({ children }: { children: React.ReactNode }) {
  return <ClientMessages area="learn">{children}</ClientMessages>;
}
