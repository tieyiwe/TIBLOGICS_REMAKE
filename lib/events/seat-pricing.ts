// Seat pricing for event checkouts (/api/events/register and the fallback
// /api/events/checkout): seat 1 at the event's price, seat 2 −17%, seat 3
// −23%, seat 4 −25%, seats 5+ at the full price again. Every amount comes
// from the Event row, in cents.

const GROUP_RATES = [
  { label: "17% group discount", rate: 0.83 },
  { label: "23% group discount", rate: 0.77 },
  { label: "25% group discount", rate: 0.75 },
];

export interface SeatLineItem {
  price_data: { currency: string; product_data: { name: string }; unit_amount: number };
  quantity: number;
}

export function eventSeatLineItems(title: string, priceCents: number, currency: string, seats: number): SeatLineItem[] {
  const curr = currency.toLowerCase();
  const item = (name: string, unit: number, quantity = 1): SeatLineItem => ({
    price_data: { currency: curr, product_data: { name }, unit_amount: unit },
    quantity,
  });
  const items = [item(seats > 1 ? `${title} — Seat 1` : title, priceCents)];
  for (let i = 1; i < Math.min(seats, 4); i++) {
    const d = GROUP_RATES[i - 1];
    items.push(item(`${title} — Seat ${i + 1} (${d.label})`, Math.round(priceCents * d.rate)));
  }
  if (seats > 4) items.push(item(`${title} — Additional Seats (standard rate)`, priceCents, seats - 4));
  return items;
}

export const seatTotal = (items: SeatLineItem[]) => items.reduce((n, i) => n + i.price_data.unit_amount * i.quantity, 0);

/** The note that ties a group's extra seats to the booking that paid for them. */
export const groupNote = (confirmationNumber: string, seat: number, seats: number) =>
  `Group booking with ${confirmationNumber} (seat ${seat} of ${seats})`;
export const groupNotePrefix = (confirmationNumber: string) => `Group booking with ${confirmationNumber} (`;
