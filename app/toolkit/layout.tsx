import ClientMessages from "@/components/i18n/ClientMessages";

// Client texts for this area (lib/i18n/client-messages.ts).
export default function ToolkitLayout({ children }: { children: React.ReactNode }) {
  return <ClientMessages area={["toolkit", "tools"]}>{children}</ClientMessages>;
}
