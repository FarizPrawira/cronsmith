import type { CronFields } from './types.js';

export const serialize = (f: CronFields): string =>
  `${f.minute} ${f.hour} ${f.dayOfMonth} ${f.month} ${f.dayOfWeek}`;

export const formatList = (values: readonly number[]): string => {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  return sorted.join(',');
};

export const formatStep = (n: number): string => (n === 1 ? '*' : `*/${n}`);

export const formatRange = (start: number, end: number): string =>
  start === end ? String(start) : `${start}-${end}`;
