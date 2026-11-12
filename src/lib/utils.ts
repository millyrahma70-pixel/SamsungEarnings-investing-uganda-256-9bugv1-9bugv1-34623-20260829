import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUGX(amount: number): string {
  return `UGX ${amount.toLocaleString()}`;
}

export function generateReferralCode(): string {
  // No confusing chars: no 0/O, no 1/I - so users don't mistype referral code
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  // FIXED: Fallback for phones / non-HTTPS where crypto.randomUUID() crashes
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysLeft(expiryDate: string): number {
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function getReferralLink(code: string): string {
  const origin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://huaweiearnings.onspace.app';

  // FIXED: Handle BASE_URL correctly - no double slash, works on GitHub Pages + onspace
  const rawBase = import.meta.env.BASE_URL ?? '/';
  const basePath = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  // If base is just '/', don't add it twice
  const cleanBase = basePath === '/' ? '/' : basePath;

  return `${origin}${cleanBase}register?ref=${code}`;
}

export function generateQRDataURL(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=1a1a2e`;
}

// ─── Daily Income Helper - 1 time per 24h ───
export function canClaimDailyIncome(lastIncomeDate: string | null, buyDate: string): boolean {
  const last = lastIncomeDate ? new Date(lastIncomeDate) : new Date(buyDate);
  const hoursSince = (Date.now() - last.getTime()) / (1000 * 60 * 60);
  return hoursSince >= 24;
}

export function hoursUntilNextIncome(lastIncomeDate: string | null, buyDate: string): number {
  const last = lastIncomeDate ? new Date(lastIncomeDate) : new Date(buyDate);
  const hoursSince = (Date.now() - last.getTime()) / (1000 * 60 * 60);
  return Math.max(0, Math.ceil(24 - hoursSince));
                          }
