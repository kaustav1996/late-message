/**
 * Pricing lives here and nowhere else. Packs are one-time purchases that add
 * recipient slots forever.
 */
export const FREE_RECIPIENTS = 3;
export const PACK_SIZE = 20;
export const PACK_PRICE_INR = 20;
export const MAX_PACKS_PER_PURCHASE = 50;

export function capacity(extraSlots: number): number {
  return FREE_RECIPIENTS + Math.max(0, extraSlots);
}

export function slotsForPacks(packs: number): number {
  return packs * PACK_SIZE;
}

export function priceForPacks(packs: number): number {
  return packs * PACK_PRICE_INR;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
