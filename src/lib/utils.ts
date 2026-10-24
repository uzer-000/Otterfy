export function formatMZN(amount: number): string {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('MZN', 'MT');
}

export const SALE_NOTIFICATION_TITLE = 'Venda Aprovada - Otterfy';

export function formatSaleNotificationMessage(amount?: number | string | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Valor : MT 0,00';
  }
  const num = Number(amount);
  const formatted = new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `Valor : MT ${formatted}`;
}

export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('258')) {
    return `+${cleaned}`;
  }
  return `+258${cleaned}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-MZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Maputo',
  }).format(d);
}

// ----------------------------------------------------
// Mozambique (Africa/Maputo, CAT = UTC+2) Timezone Helpers
// ----------------------------------------------------
export const MOZAMBIQUE_TZ_OFFSET_HOURS = 2;
export const MOZAMBIQUE_TZ_OFFSET_MS = MOZAMBIQUE_TZ_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * Returns a Date object shifted so that its UTC getters (getUTCFullYear, getUTCMonth, getUTCDate, getUTCHours, getUTCDay, etc.)
 * accurately reflect the official wall-clock time in Mozambique (Africa/Maputo, CAT = UTC+2).
 */
export function getMozambiqueDate(dateInput: Date | string | number = new Date()): Date {
  const d = typeof dateInput === 'object' && dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Date(d.getTime() + MOZAMBIQUE_TZ_OFFSET_MS);
}

/**
 * Returns the hour of the day (0 – 23) in Mozambique time.
 */
export function getMozambiqueHour(dateInput: Date | string | number): number {
  return getMozambiqueDate(dateInput).getUTCHours();
}

/**
 * Returns the day of the month (1 – 31) in Mozambique time.
 */
export function getMozambiqueDay(dateInput: Date | string | number): number {
  return getMozambiqueDate(dateInput).getUTCDate();
}

/**
 * Returns the 0-indexed month (0 = Janeiro, 11 = Dezembro) in Mozambique time.
 */
export function getMozambiqueMonth(dateInput: Date | string | number): number {
  return getMozambiqueDate(dateInput).getUTCMonth();
}

/**
 * Returns the full year (e.g. 2026) in Mozambique time.
 */
export function getMozambiqueYear(dateInput: Date | string | number): number {
  return getMozambiqueDate(dateInput).getUTCFullYear();
}

/**
 * Returns the day of the week (0 = Domingo, 1 = Segunda, ... 6 = Sábado) in Mozambique time.
 */
export function getMozambiqueDayOfWeek(dateInput: Date | string | number): number {
  return getMozambiqueDate(dateInput).getUTCDay();
}

/**
 * Returns the date formatted as YYYY-MM-DD in Mozambique time.
 */
export function getMozambiqueDateString(dateInput: Date | string | number = new Date()): string {
  const moz = getMozambiqueDate(dateInput);
  const y = moz.getUTCFullYear();
  const m = String(moz.getUTCMonth() + 1).padStart(2, '0');
  const d = String(moz.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Converts a Mozambique calendar date (year, month 0-indexed, day, hour, minute, second, ms)
 * into a true UTC Date timestamp.
 */
export function createMozambiqueDateUtc(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
  ms = 0
): Date {
  const utcMs = Date.UTC(year, month, day, hour, minute, second, ms) - MOZAMBIQUE_TZ_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Returns the UTC Date representing the start of the Mozambique day (00:00:00.000 CAT).
 */
export function getMozambiqueStartOfDayUtc(dateInput: Date | string | number = new Date()): Date {
  const moz = getMozambiqueDate(dateInput);
  return createMozambiqueDateUtc(moz.getUTCFullYear(), moz.getUTCMonth(), moz.getUTCDate(), 0, 0, 0, 0);
}

/**
 * Returns the UTC Date representing the end of the Mozambique day (23:59:59.999 CAT).
 */
export function getMozambiqueEndOfDayUtc(dateInput: Date | string | number = new Date()): Date {
  const moz = getMozambiqueDate(dateInput);
  return createMozambiqueDateUtc(moz.getUTCFullYear(), moz.getUTCMonth(), moz.getUTCDate(), 23, 59, 59, 999);
}

export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateOrderReference(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'OTF-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
