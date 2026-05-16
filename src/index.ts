import { CronBuilder } from './builder.js';

export const cron = (): CronBuilder => new CronBuilder();

export { CronBuilder } from './builder.js';
export { CronsmithError } from './errors.js';
export type {
  CronErrorCode,
  CronFields,
  Month,
  MonthInput,
  TimeUnit,
  Weekday,
  WeekdayInput,
} from './types.js';
