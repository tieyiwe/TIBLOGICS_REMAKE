import ClientMessages from "@/components/i18n/ClientMessages";
import { DonateBox, DonateCallout } from "./DonateBox";

// Server wrappers: send the donate texts ("donate.*") to the client with the
// box, so pages that use it do not carry them otherwise.
type From = "arfa" | "scholarship" | "about" | "partners" | "products";

export function DonateSection({ from, tone }: { from: From; tone?: "light" | "dark" }) {
  return (
    <ClientMessages area="donate">
      <DonateCallout from={from} tone={tone} />
    </ClientMessages>
  );
}

export function DonateInline({ from }: { from: From }) {
  return (
    <ClientMessages area="donate">
      <DonateBox from={from} />
    </ClientMessages>
  );
}
