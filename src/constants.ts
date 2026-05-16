import type { Month, TimeUnit, Weekday } from './types.js';

export const WEEKDAYS: readonly Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export const WEEKDAY_TO_NUM: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export const MONTHS: readonly Month[] = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

export const MONTH_TO_NUM: Record<Month, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export const FIELD_MAX: Record<TimeUnit, number> = {
  minutes: 59,
  hours: 23,
  days: 31,
  months: 12,
};

export const FIELD_MIN: Record<TimeUnit, number> = {
  minutes: 0,
  hours: 0,
  days: 1,
  months: 1,
};

export const TIME_UNITS: readonly TimeUnit[] = ['minutes', 'hours', 'days', 'months'] as const;
