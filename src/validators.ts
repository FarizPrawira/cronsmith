import { FIELD_MAX, MONTH_TO_NUM, MONTHS, TIME_UNITS, WEEKDAY_TO_NUM, WEEKDAYS } from './constants.js';
import { CronsmithError } from './errors.js';
import type { Month, TimeUnit, Weekday } from './types.js';

const isInt = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && Number.isFinite(n);

export const assertMinute = (m: number): void => {
  if (!isInt(m) || m < 0 || m > 59) {
    throw new CronsmithError('INVALID_MINUTE', `Invalid minute: ${m} (expected 0-59)`);
  }
};

export const assertHour = (h: number): void => {
  if (!isInt(h) || h < 0 || h > 23) {
    throw new CronsmithError('INVALID_HOUR', `Invalid hour: ${h} (expected 0-23)`);
  }
};

export const assertDayOfMonth = (d: number): void => {
  if (!isInt(d) || d < 1 || d > 31) {
    throw new CronsmithError('INVALID_DAY_OF_MONTH', `Invalid day of month: ${d} (expected 1-31)`);
  }
};

const TIME_RE = /^([0-9]{2}):([0-9]{2})$/;

export const parseTime = (s: string): { hour: number; minute: number } => {
  const m = TIME_RE.exec(s);
  if (!m) {
    throw new CronsmithError(
      'INVALID_TIME',
      `Invalid time: '${s}' (expected HH:MM, 00:00-23:59)`,
    );
  }
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new CronsmithError(
      'INVALID_TIME',
      `Invalid time: '${s}' (expected HH:MM, 00:00-23:59)`,
    );
  }
  return { hour, minute };
};

export const normalizeWeekday = (raw: string): Weekday => {
  const lc = raw.toLowerCase();
  if (!(WEEKDAYS as readonly string[]).includes(lc)) {
    throw new CronsmithError(
      'INVALID_WEEKDAY',
      `Invalid weekday: '${raw}' (expected one of: ${WEEKDAYS.join(', ')})`,
    );
  }
  return lc as Weekday;
};

export const normalizeMonth = (raw: string): Month => {
  const lc = raw.toLowerCase();
  if (!(MONTHS as readonly string[]).includes(lc)) {
    throw new CronsmithError(
      'INVALID_MONTH',
      `Invalid month: '${raw}' (expected one of: ${MONTHS.join(', ')})`,
    );
  }
  return lc as Month;
};

export const assertTimeUnit = (u: string): TimeUnit => {
  if (!(TIME_UNITS as readonly string[]).includes(u)) {
    throw new CronsmithError(
      'INVALID_UNIT',
      `Invalid time unit: '${u}' (expected one of: ${TIME_UNITS.join(', ')})`,
    );
  }
  return u as TimeUnit;
};

export const assertStep = (n: number, unit: TimeUnit): void => {
  if (!isInt(n) || n < 1) {
    throw new CronsmithError('INVALID_STEP', `Step must be >= 1, got ${n}`);
  }
  const max = FIELD_MAX[unit];
  if (n > max) {
    throw new CronsmithError(
      'INVALID_STEP',
      `Step ${n} exceeds max for ${unit} (${max})`,
    );
  }
};

export const assertHourRange = (start: number, end: number): void => {
  assertHour(start);
  assertHour(end);
};

export const weekdayNum = (w: Weekday): number => WEEKDAY_TO_NUM[w];
export const monthNum = (m: Month): number => MONTH_TO_NUM[m];
