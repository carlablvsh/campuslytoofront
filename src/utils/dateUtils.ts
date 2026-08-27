/**
 * Timezone-safe date utilities for Campusly.
 * Ensures all date calculations adhere to the user's local calendar date.
 */

// Returns YYYY-MM-DD in the user's local timezone (avoiding UTC drift from toISOString)
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parses YYYY-MM-DD into a local Date at midday (12:00) to prevent daylight savings or UTC boundary shifts
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

// Get the local day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
export function getLocalDayOfWeek(date: Date | string): number {
  if (typeof date === 'string') {
    return parseLocalDate(date).getDay();
  }
  return date.getDay();
}

// Adds or subtracts days from a Date safely
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}
