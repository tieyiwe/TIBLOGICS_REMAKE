import ClientMessages from "@/components/i18n/ClientMessages";
import HelpWidget from "@/components/learn/support/HelpWidget";

// Client texts for this area (lib/i18n/client-messages.ts).
export default function ScholarshipLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientMessages area={["learn", "member"]}>
      {children}
      <HelpWidget />
    </ClientMessages>
  );
}
