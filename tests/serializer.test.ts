import { describe, expect, it } from 'vitest';
import { formatList, formatRange, formatStep, serialize } from '../src/serializer.js';

describe('serialize', () => {
  it('joins the five cron fields with single spaces', () => {
    expect(
      serialize({ minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1' }),
    ).toBe('0 9 * * 1');
  });
});

describe('formatList', () => {
  it('sorts values ascending and removes duplicates', () => {
    expect(formatList([3, 1, 2])).toBe('1,2,3');
    expect(formatList([1, 1, 2])).toBe('1,2');
  });
  it('emits a bare value when the list has one entry', () => {
    expect(formatList([5])).toBe('5');
  });
});

describe('formatStep', () => {
  it('returns a literal * when the step is 1', () => {
    expect(formatStep(1)).toBe('*');
  });
  it('returns */n for any step greater than 1', () => {
    expect(formatStep(15)).toBe('*/15');
  });
});

describe('formatRange', () => {
  it('collapses to a single value when endpoints are equal', () => {
    expect(formatRange(5, 5)).toBe('5');
  });
  it('emits start-end for a normal ascending range', () => {
    expect(formatRange(9, 17)).toBe('9-17');
  });
});
