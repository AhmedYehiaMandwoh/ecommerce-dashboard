import { BadRequestException } from "@nestjs/common";

export const transitions: Record<string, string[]> = {
  PLACED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export function normalizeItems(items: { offerId: string; quantity: number }[]) {
  const map = new Map<string, number>();
  for (const i of items) {
    const n = (map.get(i.offerId) || 0) + i.quantity;
    if (n > 100) throw new BadRequestException("Maximum 100 units per offer");
    map.set(i.offerId, n);
  }
  return [...map]
    .map(([offerId, quantity]) => ({ offerId, quantity }))
    .sort((a, b) => a.offerId.localeCompare(b.offerId));
}
