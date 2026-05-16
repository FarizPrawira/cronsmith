import { CronsmithError } from './errors.js';
import { formatList, formatRange, formatStep, serialize } from './serializer.js';
import type { CronFields, MonthInput, TimeUnit, WeekdayInput } from './types.js';
import {
  assertDayOfMonth,
  assertHour,
  assertHourRange,
  assertMinute,
  assertStep,
  assertTimeUnit,
  monthNum,
  normalizeMonth,
  normalizeWeekday,
  parseTime,
  weekdayNum,
} from './validators.js';

type TouchState = 'hard' | 'soft' | 'untouched';

type Touched = {
  minute: TouchState;
  hour: TouchState;
  dayOfMonth: TouchState;
  month: TouchState;
  dayOfWeek: TouchState;
};

const FRESH_FIELDS: CronFields = {
  minute: '*',
  hour: '*',
  dayOfMonth: '*',
  month: '*',
  dayOfWeek: '*',
};

const FRESH_TOUCHED: Touched = {
  minute: 'untouched',
  hour: 'untouched',
  dayOfMonth: 'untouched',
  month: 'untouched',
  dayOfWeek: 'untouched',
};

const FIELD_LABEL: Record<keyof Touched, string> = {
  minute: 'minute',
  hour: 'hour',
  dayOfMonth: 'day-of-month',
  month: 'month',
  dayOfWeek: 'day-of-week',
};

const toList = <T>(x: T | readonly T[]): readonly T[] =>
  Array.isArray(x) ? (x as readonly T[]) : [x as T];

const wrapList = (start: number, end: number, min: number, max: number): number[] => {
  // Enumerate values from start..max then min..end. Used when a range wraps
  // around the field boundary (e.g. Fri→Sun on weekdays, Nov→Feb on months).
  const out: number[] = [];
  for (let v = start; v <= max; v++) out.push(v);
  for (let v = min; v <= end; v++) out.push(v);
  return out;
};

export class CronBuilder {
  private readonly fields: CronFields;
  private readonly touched: Touched;

  constructor(fields: CronFields = FRESH_FIELDS, touched: Touched = FRESH_TOUCHED) {
    this.fields = fields;
    this.touched = touched;
  }

  // hardKeys throw on conflict and become 'hard'; softPatch applies only to
  // 'untouched' fields and becomes 'soft' (a later hard call overrides it
  // silently). This is what makes pinning order-independent.
  private clone(
    patch: Partial<CronFields>,
    hardKeys: readonly (keyof Touched)[],
    softPatch?: Partial<CronFields>,
  ): CronBuilder {
    for (const k of hardKeys) {
      if (this.touched[k] === 'hard') {
        throw new CronsmithError(
          'CONFLICTING_CALL',
          `${FIELD_LABEL[k]} field has already been set. To combine values, pass an array (e.g. atMinute([5, 35])) instead of chaining.`,
        );
      }
    }
    const nextFields: CronFields = { ...this.fields, ...patch };
    const nextTouched: Touched = { ...this.touched };
    for (const k of hardKeys) nextTouched[k] = 'hard';
    if (softPatch) {
      for (const k of Object.keys(softPatch) as (keyof CronFields)[]) {
        if (this.touched[k] === 'untouched') {
          nextFields[k] = softPatch[k]!;
          nextTouched[k] = 'soft';
        }
      }
    }
    return new CronBuilder(nextFields, nextTouched);
  }

  everyMinute(): CronBuilder {
    return this.clone({ minute: '*' }, ['minute']);
  }

  // Soft-defaults below pin smaller fields so every(n, X) fires once per
  // qualifying X instead of inheriting * from the unset fields.
  every(n: number, unit: TimeUnit): CronBuilder {
    const u = assertTimeUnit(unit);
    assertStep(n, u);
    if (u === 'minutes') return this.clone({ minute: formatStep(n) }, ['minute']);
    if (u === 'hours') {
      return this.clone({ hour: formatStep(n) }, ['hour'], { minute: '0' });
    }
    if (u === 'days') {
      return this.clone({ dayOfMonth: formatStep(n) }, ['dayOfMonth'], {
        minute: '0',
        hour: '0',
      });
    }
    return this.clone({ month: formatStep(n) }, ['month'], {
      minute: '0',
      hour: '0',
      dayOfMonth: '1',
    });
  }

  atMinute(m: number | readonly number[]): CronBuilder {
    const list = toList(m);
    for (const v of list) assertMinute(v);
    return this.clone({ minute: formatList(list) }, ['minute']);
  }

  atHour(h: number | readonly number[]): CronBuilder {
    const list = toList(h);
    for (const v of list) assertHour(v);
    return this.clone({ hour: formatList(list) }, ['hour'], { minute: '0' });
  }

  at(time: string): CronBuilder {
    const { hour, minute } = parseTime(time);
    return this.clone({ minute: String(minute), hour: String(hour) }, ['minute', 'hour']);
  }

  on(day: WeekdayInput | readonly WeekdayInput[]): CronBuilder {
    const nums = toList(day).map((d) => weekdayNum(normalizeWeekday(d)));
    return this.clone({ dayOfWeek: formatList(nums) }, ['dayOfWeek']);
  }

  onWeekdays(): CronBuilder {
    return this.clone({ dayOfWeek: '1-5' }, ['dayOfWeek']);
  }

  onWeekends(): CronBuilder {
    return this.clone({ dayOfWeek: '0,6' }, ['dayOfWeek']);
  }

  dayOfMonth(d: number | readonly number[]): CronBuilder {
    const list = toList(d);
    for (const v of list) assertDayOfMonth(v);
    return this.clone({ dayOfMonth: formatList(list) }, ['dayOfMonth']);
  }

  inMonth(m: MonthInput | readonly MonthInput[]): CronBuilder {
    const nums = toList(m).map((x) => monthNum(normalizeMonth(x)));
    return this.clone({ month: formatList(nums) }, ['month']);
  }

  betweenHours(start: number, end: number): CronBuilder {
    assertHourRange(start, end);
    if (start <= end) return this.clone({ hour: formatRange(start, end) }, ['hour']);
    const hours = wrapList(start, end, 0, 23);
    return this.clone({ hour: hours.join(',') }, ['hour']);
  }

  betweenDays(start: WeekdayInput, end: WeekdayInput): CronBuilder {
    const s = weekdayNum(normalizeWeekday(start));
    const e = weekdayNum(normalizeWeekday(end));
    if (s <= e) return this.clone({ dayOfWeek: formatRange(s, e) }, ['dayOfWeek']);
    const days = wrapList(s, e, 0, 6);
    return this.clone({ dayOfWeek: days.join(',') }, ['dayOfWeek']);
  }

  betweenMonths(start: MonthInput, end: MonthInput): CronBuilder {
    const s = monthNum(normalizeMonth(start));
    const e = monthNum(normalizeMonth(end));
    if (s <= e) return this.clone({ month: formatRange(s, e) }, ['month']);
    const months = wrapList(s, e, 1, 12);
    return this.clone({ month: months.join(',') }, ['month']);
  }

  toString(): string {
    return serialize(this.fields);
  }

  toObject(): CronFields {
    return { ...this.fields };
  }
}
