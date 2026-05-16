export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type WeekdayInput = Weekday | Capitalize<Weekday> | Uppercase<Weekday>;

export type Month =
  | 'january'
  | 'february'
  | 'march'
  | 'april'
  | 'may'
  | 'june'
  | 'july'
  | 'august'
  | 'september'
  | 'october'
  | 'november'
  | 'december';

export type MonthInput = Month | Capitalize<Month> | Uppercase<Month>;

export type TimeUnit = 'minutes' | 'hours' | 'days' | 'months';

export type CronFields = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export type CronErrorCode =
  | 'INVALID_MINUTE'
  | 'INVALID_HOUR'
  | 'INVALID_TIME'
  | 'INVALID_DAY_OF_MONTH'
  | 'INVALID_WEEKDAY'
  | 'INVALID_MONTH'
  | 'INVALID_STEP'
  | 'INVALID_RANGE'
  | 'INVALID_UNIT'
  | 'CONFLICTING_CALL';
