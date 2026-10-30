import { Prisma } from "@prisma/client";
export const PUBLIC_STATUSES = ["CONFIRMED", "VERIFIED"] as const;
export const CURRENT_DAYS = 30;
export function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
export function isCurrent(date: Date | null, now = new Date()) {
  if (!date) return false;
  const age = (now.getTime() - date.getTime()) / 86_400_000;
  return age >= 0 && age <= CURRENT_DAYS;
}
export function toNumber(value: Prisma.Decimal | number | null) {
  return value == null ? null : Number(value);
}
