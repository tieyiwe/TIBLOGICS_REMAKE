import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

export function getDaysRemaining(deadline: Date | string): number {
  const now = new Date();
  const end = new Date(deadline);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getRelativeDeadline(deadline: Date | string): {
  label: string;
  color: string;
} {
  const days = getDaysRemaining(deadline);
  if (days < 0)
    return { label: `${Math.abs(days)}d overdue`, color: "text-red-500" };
  if (days === 0) return { label: "Due today", color: "text-red-500" };
  if (days <= 7)
    return { label: `${days}d left`, color: "text-red-500" };
  if (days <= 14)
    return { label: `${days}d left`, color: "text-[#F47C20]" };
  if (days <= 30)
    return { label: `${days}d left`, color: "text-[#2251A3]" };
  return { label: `${days}d left`, color: "text-[#7A8FA6]" };
}
