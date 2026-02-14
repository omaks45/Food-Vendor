/* eslint-disable prettier/prettier */
/**
 * Add minutes to a date
 */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

/**
 * Check if date has passed
 */
export function isPast(date: Date): boolean {
    return date < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date): boolean {
    return date > new Date();
}

/**
 * Get difference in hours between two dates
 */
export function differenceInHours(date1: Date, date2: Date): number {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diff / 3600000);
}

/**
 * Get difference in minutes between two dates
 */
export function differenceInMinutes(date1: Date, date2: Date): number {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diff / 60000);
}

/**
 * Format date to ISO string without milliseconds
 */
export function toISOStringWithoutMs(date: Date): string {
    return date.toISOString().split('.')[0] + 'Z';
}