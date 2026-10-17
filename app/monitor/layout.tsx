import ClientMessages from "@/components/i18n/ClientMessages";

// Client texts for this area (lib/i18n/client-messages.ts).
export default function MonitorLayout({ children }: { children: React.ReactNode }) {
  return <ClientMessages area="tools">{children}</ClientMessages>;
}
