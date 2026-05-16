import { describe, expect, it } from 'vitest';
import { CronsmithError } from '../src/errors.js';
import {
  assertDayOfMonth,
  assertHour,
  assertMinute,
  assertStep,
  assertHourRange,
  assertTimeUnit,
  normalizeMonth,
  normalizeWeekday,
  parseTime,
} from '../src/validators.js';

describe('assertMinute', () => {
  it('accepts values from 0 through 59', () => {
    expect(() => assertMinute(0)).not.toThrow();
    expect(() => assertMinute(59)).not.toThrow();
  });
  it('throws when the value is outside 0-59', () => {
    expect(() => assertMinute(-1)).toThrow(CronsmithError);
    expect(() => assertMinute(60)).toThrow(/0-59/);
  });
  it('throws when the value is not an integer', () => {
    expect(() => assertMinute(1.5)).toThrow(CronsmithError);
    expect(() => assertMinute(Number.NaN)).toThrow();
  });
});

describe('assertHour', () => {
  it('accepts values from 0 through 23', () => {
    expect(() => assertHour(0)).not.toThrow();
    expect(() => assertHour(23)).not.toThrow();
  });
  it('throws when the value is 24 or above', () => {
    expect(() => assertHour(24)).toThrow(/0-23/);
    expect(() => assertHour(25)).toThrow(/Invalid hour: 25/);
  });
});

describe('assertDayOfMonth', () => {
  it('accepts values from 1 through 31', () => {
    expect(() => assertDayOfMonth(1)).not.toThrow();
    expect(() => assertDayOfMonth(31)).not.toThrow();
  });
  it('throws when the value is 0 or above 31', () => {
    expect(() => assertDayOfMonth(0)).toThrow(/1-31/);
    expect(() => assertDayOfMonth(32)).toThrow(/32/);
  });
});

describe('parseTime', () => {
  it('parses a valid zero-padded HH:MM string', () => {
    expect(parseTime('09:00')).toEqual({ hour: 9, minute: 0 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
  });
  it('throws when the time is not zero-padded', () => {
    expect(() => parseTime('9:00')).toThrow(/HH:MM/);
    expect(() => parseTime('09:0')).toThrow(/HH:MM/);
  });
  it('throws when the hour or minute is outside the legal range', () => {
    expect(() => parseTime('25:00')).toThrow(/00:00-23:59/);
    expect(() => parseTime('12:60')).toThrow();
  });
});

describe('normalizeWeekday', () => {
  it('lowercases mixed-case input', () => {
    expect(normalizeWeekday('Monday')).toBe('monday');
    expect(normalizeWeekday('FRIDAY')).toBe('friday');
  });
  it('throws when the weekday name is unknown', () => {
    expect(() => normalizeWeekday('funday')).toThrow(/Invalid weekday/);
  });
});

describe('normalizeMonth', () => {
  it('lowercases mixed-case input', () => {
    expect(normalizeMonth('January')).toBe('january');
  });
  it('throws when the month name is unknown', () => {
    expect(() => normalizeMonth('smarch')).toThrow(/Invalid month/);
  });
});

describe('assertTimeUnit', () => {
  it('accepts the four supported units', () => {
    expect(assertTimeUnit('minutes')).toBe('minutes');
    expect(assertTimeUnit('hours')).toBe('hours');
    expect(assertTimeUnit('days')).toBe('days');
    expect(assertTimeUnit('months')).toBe('months');
  });
  it('throws when the unit is unsupported', () => {
    expect(() => assertTimeUnit('seconds')).toThrow(/Invalid time unit/);
    expect(() => assertTimeUnit('years')).toThrow();
    expect(() => assertTimeUnit('weeks')).toThrow();
  });
});

describe('assertStep', () => {
  it('accepts values from 1 up to the unit max', () => {
    expect(() => assertStep(1, 'minutes')).not.toThrow();
    expect(() => assertStep(59, 'minutes')).not.toThrow();
    expect(() => assertStep(23, 'hours')).not.toThrow();
  });
  it('throws when the step is 0 or negative', () => {
    expect(() => assertStep(0, 'minutes')).toThrow(/>= 1/);
    expect(() => assertStep(-1, 'minutes')).toThrow();
  });
  it('throws when the step exceeds the unit max', () => {
    expect(() => assertStep(60, 'minutes')).toThrow(/exceeds max/);
    expect(() => assertStep(24, 'hours')).toThrow(/exceeds max/);
  });
});

describe('assertHourRange', () => {
  it('accepts any pair of valid hours, including wrap-around', () => {
    expect(() => assertHourRange(9, 17)).not.toThrow();
    expect(() => assertHourRange(0, 0)).not.toThrow();
    expect(() => assertHourRange(0, 23)).not.toThrow();
    expect(() => assertHourRange(22, 2)).not.toThrow();
  });
  it('throws when either endpoint is outside 0-23', () => {
    expect(() => assertHourRange(-1, 5)).toThrow(CronsmithError);
    expect(() => assertHourRange(9, 24)).toThrow(CronsmithError);
  });
});
