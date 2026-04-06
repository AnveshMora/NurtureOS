import { startOfWeek, endOfWeek, getISOWeek, getYear, addWeeks, subWeeks, format, differenceInMonths } from 'date-fns';
import type { AgeBand } from '../types';

export function getCurrentWeekNumber(): number {
  return getISOWeek(new Date());
}

export function getCurrentYear(): number {
  return getYear(new Date());
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday start
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekRange(weekNumber: number, year: number): { start: Date; end: Date } {
  // Get Jan 4 of the year (always in week 1 per ISO)
  const jan4 = new Date(year, 0, 4);
  const weekStart = startOfWeek(jan4, { weekStartsOn: 1 });
  const targetStart = addWeeks(weekStart, weekNumber - 1);
  const targetEnd = endOfWeek(targetStart, { weekStartsOn: 1 });
  return { start: targetStart, end: targetEnd };
}

export function formatWeekRange(weekNumber: number, year: number): string {
  const { start, end } = getWeekRange(weekNumber, year);
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function navigateWeek(weekNumber: number, year: number, direction: 'prev' | 'next'): { weekNumber: number; year: number } {
  const { start } = getWeekRange(weekNumber, year);
  const newDate = direction === 'next' ? addWeeks(start, 1) : subWeeks(start, 1);
  return {
    weekNumber: getISOWeek(newDate),
    year: getYear(newDate),
  };
}

export function calculateAgeBand(dateOfBirth: string): AgeBand {
  const dob = new Date(dateOfBirth);
  const months = differenceInMonths(new Date(), dob);

  if (months < 36) return '2-3';
  if (months < 48) return '3-4';
  if (months < 60) return '4-5';
  return '5-6';
}

export function calculateAge(dateOfBirth: string): { years: number; months: number } {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const totalMonths = differenceInMonths(now, dob);
  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
  };
}

export function formatAge(dateOfBirth: string): string {
  const { years, months } = calculateAge(dateOfBirth);
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
}
