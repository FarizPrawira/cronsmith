import { describe, expect, it } from 'vitest';
import { cron } from '../src/index.js';

describe('README examples', () => {
  it('builds "every Monday at 9 AM"', () => {
    expect(cron().at('09:00').on('monday').toString()).toBe('0 9 * * 1');
  });

  it('builds "every 15 minutes during business hours, weekdays only"', () => {
    expect(
      cron().every(15, 'minutes').betweenHours(9, 17).onWeekdays().toString(),
    ).toBe('*/15 9-17 * * 1-5');
  });

  it('builds "first of every quarter at midnight"', () => {
    expect(
      cron()
        .at('00:00')
        .dayOfMonth(1)
        .inMonth(['january', 'april', 'july', 'october'])
        .toString(),
    ).toBe('0 0 1 1,4,7,10 *');
  });
});
