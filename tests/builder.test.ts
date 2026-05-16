import { describe, expect, it } from 'vitest';
import { cron } from '../src/index.js';
import { CronsmithError } from '../src/errors.js';

describe('cron() entry', () => {
  it('returns all-stars by default', () => {
    expect(cron().toString()).toBe('* * * * *');
  });
});

describe('immutability', () => {
  it('does not mutate the source builder when chained', () => {
    const base = cron().at('09:00');
    const monday = base.on('monday');
    const friday = base.on('friday');
    expect(base.toString()).toBe('0 9 * * *');
    expect(monday.toString()).toBe('0 9 * * 1');
    expect(friday.toString()).toBe('0 9 * * 5');
  });
});

describe('every()', () => {
  it('emits */n in the minute field for minutes', () => {
    expect(cron().every(15, 'minutes').toString()).toBe('*/15 * * * *');
  });
  it('throws when the step is 0', () => {
    expect(() => cron().every(0, 'minutes')).toThrow(/>= 1/);
  });
  it('throws when the step exceeds the unit max', () => {
    expect(() => cron().every(60, 'minutes')).toThrow(/exceeds max/);
    expect(() => cron().every(24, 'hours')).toThrow(/exceeds max/);
  });
  it('throws when the unit is unrecognized', () => {
    expect(() => cron().every(5, 'seconds' as unknown as 'minutes')).toThrow(/Invalid time unit/);
  });
  it('emits */n in the hour field and soft-defaults minute to 0 for hours', () => {
    expect(cron().every(2, 'hours').toString()).toBe('0 */2 * * *');
  });
  it('emits */n in the dayOfMonth field and soft-defaults minute and hour for days', () => {
    expect(cron().every(3, 'days').toString()).toBe('0 0 */3 * *');
  });
  it('emits */n in the month field and soft-defaults minute, hour, and dayOfMonth for months', () => {
    expect(cron().every(2, 'months').toString()).toBe('0 0 1 */2 *');
  });
});

describe('atMinute()', () => {
  it('pins minute when given a single value', () => {
    expect(cron().atMinute(30).toString()).toBe('30 * * * *');
  });
  it('pins multiple minutes when given an array', () => {
    expect(cron().atMinute([0, 30]).toString()).toBe('0,30 * * * *');
  });
});

describe('atHour()', () => {
  it('pins hour and soft-defaults minute to 0', () => {
    expect(cron().atHour(14).toString()).toBe('0 14 * * *');
  });
  it('sorts and dedupes when given an array, and soft-defaults minute to 0', () => {
    expect(cron().atHour([9, 17, 9]).toString()).toBe('0 9,17 * * *');
  });
});

describe('at()', () => {
  it('pins both minute and hour from an HH:MM string', () => {
    expect(cron().at('09:00').toString()).toBe('0 9 * * *');
    expect(cron().at('23:45').toString()).toBe('45 23 * * *');
  });
  it('preserves the 00:00 midnight pin when chained with other fields', () => {
    expect(cron().at('00:00').onWeekdays().toString()).toBe('0 0 * * 1-5');
    expect(cron().at('00:00').dayOfMonth(1).toString()).toBe('0 0 1 * *');
    expect(cron().at('00:00').inMonth('january').toString()).toBe('0 0 * 1 *');
  });
});

describe('everyMinute()', () => {
  it('emits a literal * in the minute field', () => {
    expect(cron().everyMinute().toString()).toBe('* * * * *');
  });
});

describe('on() and weekday selectors', () => {
  it('pins a single weekday', () => {
    expect(cron().on('monday').toString()).toBe('* * * * 1');
    expect(cron().on('sunday').toString()).toBe('* * * * 0');
  });
  it('pins multiple weekdays when given an array', () => {
    expect(cron().on(['monday', 'friday']).toString()).toBe('* * * * 1,5');
  });
  it('accepts Capitalize and Uppercase forms from TypeScript callers', () => {
    expect(cron().on('Monday').toString()).toBe('* * * * 1');
    expect(cron().on('FRIDAY').toString()).toBe('* * * * 5');
  });
  it('accepts arbitrary mixed-case input from untyped JS callers at runtime', () => {
    expect(cron().on('mOnDaY' as unknown as 'monday').toString()).toBe('* * * * 1');
  });
  it('pins Monday through Friday for onWeekdays()', () => {
    expect(cron().onWeekdays().toString()).toBe('* * * * 1-5');
  });
  it('pins Saturday and Sunday for onWeekends()', () => {
    expect(cron().onWeekends().toString()).toBe('* * * * 0,6');
  });
});

describe('dayOfMonth() and inMonth()', () => {
  it('pins a single day of the month', () => {
    expect(cron().dayOfMonth(15).toString()).toBe('* * 15 * *');
  });
  it('pins multiple days when given an array', () => {
    expect(cron().dayOfMonth([1, 15]).toString()).toBe('* * 1,15 * *');
  });
  it('pins a single month', () => {
    expect(cron().inMonth('june').toString()).toBe('* * * 6 *');
  });
  it('pins multiple months when given an array', () => {
    expect(
      cron().inMonth(['january', 'april', 'july', 'october']).toString(),
    ).toBe('* * * 1,4,7,10 *');
  });
});

describe('between*() range methods', () => {
  it('emits an ascending hour range for betweenHours()', () => {
    expect(cron().betweenHours(9, 17).toString()).toBe('* 9-17 * * *');
  });
  it('emits an enumerated list when betweenHours() wraps midnight', () => {
    expect(cron().betweenHours(22, 2).toString()).toBe('* 22,23,0,1,2 * * *');
  });
  it('emits an ascending day range for betweenDays()', () => {
    expect(cron().betweenDays('monday', 'friday').toString()).toBe('* * * * 1-5');
  });
  it('emits an enumerated list when betweenDays() wraps the week', () => {
    expect(cron().betweenDays('friday', 'sunday').toString()).toBe('* * * * 5,6,0');
    expect(cron().betweenDays('saturday', 'monday').toString()).toBe('* * * * 6,0,1');
  });
  it('emits an ascending month range for betweenMonths()', () => {
    expect(cron().betweenMonths('march', 'september').toString()).toBe('* * * 3-9 *');
  });
  it('emits an enumerated list when betweenMonths() wraps the year', () => {
    expect(cron().betweenMonths('november', 'february').toString()).toBe('* * * 11,12,1,2 *');
  });
  it('collapses to a single value when betweenHours() endpoints are equal', () => {
    expect(cron().betweenHours(5, 5).toString()).toBe('* 5 * * *');
  });
  it('collapses to a single value when betweenDays() endpoints are equal', () => {
    expect(cron().betweenDays('monday', 'monday').toString()).toBe('* * * * 1');
  });
  it('collapses to a single value when betweenMonths() endpoints are equal', () => {
    expect(cron().betweenMonths('june', 'june').toString()).toBe('* * * 6 *');
  });
});

describe('throws when the same field is set twice', () => {
  it('throws when atMinute is called twice', () => {
    expect(() => cron().atMinute(5).atMinute(10)).toThrow(CronsmithError);
    expect(() => cron().atMinute(5).atMinute(10)).toThrow(/minute field has already been set/);
  });
  it('throws when atMinute follows every(minutes)', () => {
    expect(() => cron().every(15, 'minutes').atMinute(5)).toThrow(/minute field/);
  });
  it('throws when atHour follows at()', () => {
    expect(() => cron().at('09:00').atHour(10)).toThrow(/hour field/);
  });
  it('throws when atMinute follows at()', () => {
    expect(() => cron().at('09:00').atMinute(10)).toThrow(/minute field/);
  });
  it('throws when onWeekdays follows on()', () => {
    expect(() => cron().on('monday').onWeekdays()).toThrow(/day-of-week/);
  });
  it('throws when atHour follows betweenHours()', () => {
    expect(() => cron().betweenHours(9, 17).atHour(10)).toThrow(/hour field/);
  });
  it('throws when dayOfMonth is called twice', () => {
    expect(() => cron().dayOfMonth(1).dayOfMonth(15)).toThrow(/day-of-month/);
  });
  it('throws when betweenMonths follows inMonth', () => {
    expect(() => cron().inMonth('january').betweenMonths('march', 'june')).toThrow(/month field/);
  });
  it('throws when dayOfMonth follows every(days)', () => {
    expect(() => cron().every(3, 'days').dayOfMonth(15)).toThrow(/day-of-month/);
  });
  it('throws when inMonth follows every(months)', () => {
    expect(() => cron().every(2, 'months').inMonth('june')).toThrow(/month field/);
  });
  it('throws when atHour follows every(hours)', () => {
    expect(() => cron().every(2, 'hours').atHour(10)).toThrow(/hour field/);
  });
  it('throws when every(minutes) follows atMinute — every() never silently overrides', () => {
    expect(() => cron().atMinute(5).every(15, 'minutes')).toThrow(/minute field/);
  });
  it('throws when every(hours) follows atHour — every() never silently overrides', () => {
    expect(() => cron().atHour(10).every(2, 'hours')).toThrow(/hour field/);
  });
  it('throws when every(days) follows dayOfMonth — every() never silently overrides', () => {
    expect(() => cron().dayOfMonth(15).every(3, 'days')).toThrow(/day-of-month/);
  });
  it('throws when every(months) follows inMonth — every() never silently overrides', () => {
    expect(() => cron().inMonth('june').every(2, 'months')).toThrow(/month field/);
  });
});

describe('DOM + DOW coexist with OR semantics', () => {
  it('allows both day-of-month and day-of-week to be set together', () => {
    expect(cron().dayOfMonth(1).on('monday').toString()).toBe('* * 1 * 1');
  });
});

describe('atHour() soft-default for minute', () => {
  it('overrides the soft minute default when atMinute is called after atHour', () => {
    expect(cron().atHour(9).atMinute(30).toString()).toBe('30 9 * * *');
  });
  it('preserves an explicit atMinute called before atHour', () => {
    expect(cron().atMinute(30).atHour(9).toString()).toBe('30 9 * * *');
  });
  it('throws when atMinute is called twice even with atHour in the chain', () => {
    expect(() => cron().atHour(9).atMinute(15).atMinute(45)).toThrow(/minute field/);
  });
});

describe('every(n, hours) soft-default for minute', () => {
  it('overrides the soft minute default when atMinute is called after every()', () => {
    expect(cron().every(2, 'hours').atMinute(30).toString()).toBe('30 */2 * * *');
  });
  it('preserves an explicit atMinute called before every()', () => {
    expect(cron().atMinute(30).every(2, 'hours').toString()).toBe('30 */2 * * *');
  });
  it('overrides the soft minute default when atMinute is given an array', () => {
    expect(cron().every(3, 'hours').atMinute([0, 30]).toString()).toBe('0,30 */3 * * *');
  });
  it('throws when atMinute is called twice after every(hours)', () => {
    expect(() => cron().every(2, 'hours').atMinute(15).atMinute(45)).toThrow(/minute field/);
  });
  it('throws when at() follows every(hours) — at() hard-sets the hour field too', () => {
    expect(() => cron().every(2, 'hours').at('09:30')).toThrow(/hour field/);
  });
});

describe('every(n, days) soft-defaults', () => {
  it('overrides the soft hour default when atHour is called after every(days)', () => {
    expect(cron().every(3, 'days').atHour(9).toString()).toBe('0 9 */3 * *');
  });
  it('overrides both soft defaults when at() is called after every(days)', () => {
    expect(cron().every(3, 'days').at('09:30').toString()).toBe('30 9 */3 * *');
  });
  it('preserves explicit time settings made before every(days)', () => {
    expect(cron().at('09:30').every(3, 'days').toString()).toBe('30 9 */3 * *');
  });
});

describe('every(n, months) soft-defaults', () => {
  it('overrides the soft dayOfMonth default when dayOfMonth is called after every(months)', () => {
    expect(cron().every(2, 'months').dayOfMonth(15).toString()).toBe('0 0 15 */2 *');
  });
  it('overrides time and day soft-defaults when at() and dayOfMonth follow every(months)', () => {
    expect(cron().every(2, 'months').at('09:30').dayOfMonth(15).toString()).toBe('30 9 15 */2 *');
  });
  it('preserves explicit settings made before every(months)', () => {
    expect(cron().at('09:30').dayOfMonth(15).every(2, 'months').toString()).toBe('30 9 15 */2 *');
  });
});

describe('everyMinute() escapes the minute soft-default', () => {
  it('restores every-minute firing when called after atHour', () => {
    expect(cron().atHour(9).everyMinute().toString()).toBe('* 9 * * *');
  });
  it('restores every-minute firing when called before atHour', () => {
    expect(cron().everyMinute().atHour(9).toString()).toBe('* 9 * * *');
  });
  it('restores every-minute firing when called after every(hours)', () => {
    expect(cron().every(2, 'hours').everyMinute().toString()).toBe('* */2 * * *');
  });
  it('restores every-minute firing when called before every(hours)', () => {
    expect(cron().everyMinute().every(2, 'hours').toString()).toBe('* */2 * * *');
  });
  it('throws when everyMinute is called twice', () => {
    expect(() => cron().everyMinute().everyMinute()).toThrow(/minute field/);
  });
});

describe('toObject()', () => {
  it('returns the cron fields as a plain object', () => {
    expect(cron().at('09:00').onWeekdays().toObject()).toEqual({
      minute: '0',
      hour: '9',
      dayOfMonth: '*',
      month: '*',
      dayOfWeek: '1-5',
    });
  });
});

describe('CronsmithError', () => {
  it('attaches a programmatic code to validation failures', () => {
    try {
      cron().atHour(25);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(CronsmithError);
      expect((e as CronsmithError).code).toBe('INVALID_HOUR');
    }
  });
});
