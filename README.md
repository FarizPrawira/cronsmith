# cronsmith

[![npm version](https://img.shields.io/npm/v/cronsmith.svg)](https://www.npmjs.com/package/cronsmith)
[![npm downloads](https://img.shields.io/npm/dm/cronsmith.svg)](https://www.npmjs.com/package/cronsmith)
![zero dependencies](https://img.shields.io/badge/dependencies-none-brightgreen)
![types included](https://img.shields.io/badge/types-included-blue)
[![license MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Fluent, type-safe, zero-runtime-dependency cron expression builder for TypeScript and JavaScript. Works in Node, Deno, Bun, and the browser.

- Fluent chainable API — `cron().every(5, 'minutes').toString()`
- Type-safe inputs — `'monday'` autocompletes, `'Munday'` won't compile
- Validates at the call site — `atHour(25)` throws immediately, not at 2 a.m. when your scheduler silently skips
- Immutable builder — every method returns a new instance, safe to share and reuse
- Zero runtime dependencies, ships with TypeScript types
- Emits standard 5-field cron strings — pair it with any scheduler (`node-cron`, `croner`, system crontab)
- Tiny surface area — one entry point, one error class, no hidden config

```ts
import { cron } from 'cronsmith';

// Poll a flaky upstream every 5 minutes — one of the most common cron shapes.
cron().every(5, 'minutes').toString();
// → "*/5 * * * *"

// Nightly database backup at 02:30 — single call sets both minute and hour.
cron().at('02:30').toString();
// → "30 2 * * *"

// Send the Monday-morning digest. Weekdays use lowercase string literals.
cron().on('monday').toString();
// → "* * * * 1"

// Run on the 1st and 15th — payroll, invoicing, mid-month reports.
cron().dayOfMonth([1, 15]).toString();
// → "* * 1,15 * *"

// Quarterly cleanup job. Month names are typed literals, not magic numbers.
cron().inMonth(['january', 'april', 'july', 'october']).toString();
// → "* * * 1,4,7,10 *"

// Business-hours window — pair with a minute selector to control firing rate.
cron().betweenHours(9, 17).toString();
// → "* 9-17 * * *"  (every minute, 09:00–17:59 — chain .every(15,'minutes') etc.)

// Weekend-only batch job — Saturday and Sunday, leaves other fields wild.
cron().onWeekends().toString();
// → "* * * * 0,6"

// Wrap-around weekend coverage: Friday through Sunday inclusive.
cron().betweenDays('friday', 'sunday').toString();
// → "* * * * 5,6,0"
```

## Install

```sh
npm install cronsmith
# or
pnpm add cronsmith
# or
yarn add cronsmith
# or
bun add cronsmith
```

Both ESM and CommonJS are shipped:

```ts
import { cron } from 'cronsmith';            // ESM / TypeScript
const { cron } = require('cronsmith');       // CommonJS
```

Deno (via npm specifier):

```ts
import { cron } from 'npm:cronsmith';
```

Zero runtime dependencies. DevDeps (tsup, vitest, typescript) are not installed for consumers.

## Why

Writing `0 9 * * 1-5` by hand is error-prone and impossible to autocomplete. Cronsmith gives you typed inputs, throws on invalid values at the method call (not when your scheduler silently fails), and produces standard 5-field cron strings.

## API

`cron()` returns an immutable `CronBuilder`. Every method returns a new builder.

### Steps and pins

| Method | Example | Result | Reads as |
|---|---|---|---|
| `.everyMinute()` | `.everyMinute()` | `* * * * *` | Every minute, forever |
| `.every(n, 'minutes')` | `.every(15, 'minutes')` | `*/15 * * * *` | Every 15 minutes |
| `.every(n, 'hours')` | `.every(2, 'hours')` | `0 */2 * * *` | Once every 2 hours, on the hour |
| `.every(n, 'days')` | `.every(3, 'days')` | `0 0 */3 * *` | Once a day at midnight, every 3rd day of the month |
| `.every(n, 'months')` | `.every(2, 'months')` | `0 0 1 */2 *` | Once at midnight on the 1st, every 2nd month of the year |
| `.atMinute(n)` | `.atMinute(30)` | `30 * * * *` | At minute 30 of every hour |
| `.atMinute(n[])` | `.atMinute([0, 30])` | `0,30 * * * *` | At minute 0 and minute 30 of every hour |
| `.atHour(n)` | `.atHour(9)` | `0 9 * * *` | Once a day at 09:00 |
| `.atHour(n[])` | `.atHour([9, 17])` | `0 9,17 * * *` | Twice a day, at 09:00 and 17:00 |
| `.at('HH:MM')` | `.at('09:30')` | `30 9 * * *` | Once a day at 09:30 |

### Day / month / day-of-week

| Method | Example | Result | Reads as |
|---|---|---|---|
| `.on(day)` | `.on('monday')` | `* * * * 1` | On Mondays |
| `.on(day[])` | `.on(['monday', 'friday'])` | `* * * * 1,5` | On Mondays and Fridays |
| `.onWeekdays()` | `.onWeekdays()` | `* * * * 1-5` | Monday through Friday |
| `.onWeekends()` | `.onWeekends()` | `* * * * 0,6` | Saturday and Sunday |
| `.dayOfMonth(n)` | `.dayOfMonth(1)` | `* * 1 * *` | On the 1st of every month |
| `.dayOfMonth(n[])` | `.dayOfMonth([1, 15])` | `* * 1,15 * *` | On the 1st and 15th of every month |
| `.inMonth(m)` | `.inMonth('june')` | `* * * 6 *` | In June |
| `.inMonth(m[])` | `.inMonth(['january', 'july'])` | `* * * 1,7 *` | In January and July |

### Ranges

| Method | Example | Result | Reads as |
|---|---|---|---|
| `.betweenHours(from, to)` | `.betweenHours(9, 17)` | `* 9-17 * * *` | Hours 9 through 17 |
| `.betweenDays(from, to)` | `.betweenDays('monday', 'friday')` | `* * * * 1-5` | Monday through Friday |
| `.betweenMonths(from, to)` | `.betweenMonths('march', 'september')` | `* * * 3-9 *` | March through September |

All three `between*` methods support wrap-around when the start is greater than the end:

- `betweenHours(22, 2)` → `* 22,23,0,1,2 * * *` (overnight window)
- `betweenDays('friday', 'sunday')` → `* * * * 5,6,0` (weekend straddling the week boundary)
- `betweenMonths('november', 'february')` → `* * * 11,12,1,2 *` (winter straddling year-end)

### Output

| Method | Result | Reads as |
|---|---|---|
| `.toString()` | 5-field cron string | Render the builder as a cron expression you can paste into a scheduler |
| `.toObject()` | `{ minute, hour, dayOfMonth, month, dayOfWeek }` | Get each field separately, useful for storing in a database or rendering in a UI |

## Rules

**Each field can only be set once.** Re-setting the same field throws `CronsmithError` with code `CONFLICTING_CALL`. To combine values, pass an array:

```ts
cron().on(['monday', 'friday']).toString();    // ✓ → "* * * * 1,5"
cron().on('monday').on('friday').toString();   // ✗ throws
```

**Validation throws at the method call**, not at runtime. `cron().atHour(25)` throws immediately.

**Names are case-insensitive.** TypeScript callers can pass lowercase (`'monday'`), Capitalize (`'Monday'`), or Uppercase (`'MONDAY'`) — all three are typed and autocomplete. At runtime, any case is normalized (`'mOnDaY'` works too, though you'd lose autocomplete on that one).

**Sunday is 0** in output. Wrap-around ranges that cross Saturday→Sunday emit a comma list rather than `5-7`.

**DOM and DOW combine with OR semantics.** This is standard Vixie cron behavior, not a Cronsmith choice:

```ts
cron().dayOfMonth(1).on('monday').toString();
// → "* * 1 * 1"
// Runs on every 1st AND every Monday — not "the 1st only if Monday."
```

**Pinning methods soft-default smaller fields.** Without this, `*` in the smaller fields would multiply firings by 60 / 1,440 / etc., which is almost never what "at 9 AM" or "every 3 days" means. Defaults are overridable in either call order.

| Method | Pins | Smaller fields soft-defaulted to |
|---|---|---|
| `.atHour(...)` | hour | minute = 0 |
| `.every(n, 'hours')` | hour | minute = 0 |
| `.every(n, 'days')` | dayOfMonth | minute = 0, hour = 0 |
| `.every(n, 'months')` | month | minute = 0, hour = 0, dayOfMonth = 1 |

```ts
cron().atHour(9).toString();                       // → "0 9 * * *"     (once a day at 09:00)
cron().atMinute(30).atHour(9).toString();          // → "30 9 * * *"    (override, order-independent)

cron().every(2, 'hours').toString();               // → "0 */2 * * *"   (12 firings a day)
cron().every(3, 'days').toString();                // → "0 0 */3 * *"   (~10 firings a month, at midnight)
cron().every(3, 'days').at('09:30').toString();    // → "30 9 */3 * *"  (override time, keep day step)
cron().every(2, 'months').toString();              // → "0 0 1 */2 *"   (6 firings a year, on the 1st at midnight)
```

**Range and selector methods do not soft-default time.** `.betweenHours()`, `.betweenDays()`, `.betweenMonths()`, `.on()`, `.dayOfMonth()`, and `.inMonth()` only set their own field. Minute and hour stay `*` so they compose cleanly with `.every(N, 'minutes')` or `.atMinute(...)`:

```ts
cron().betweenHours(9, 17).toString();             // → "* 9-17 * * *"   (every minute, 9–17)
cron().every(15, 'minutes').betweenHours(9, 17).toString();
// → "*/15 9-17 * * *"  (the usual business-hours pattern)
```

**`.every(n, ...)` resets at the next-larger field boundary.** `*/n` in cron is calendar-aligned, not period-true. The step restarts when the next-larger field rolls over, so the gap between firings can be uneven:

| Step | Aligns evenly when | Otherwise the gap shows up at |
|---|---|---|
| `every(n, 'minutes')` | `60 % n === 0` | the top of the next hour |
| `every(n, 'hours')` | `24 % n === 0` | midnight (e.g. `every(5,'hours')` → 4-hour gap) |
| `every(n, 'days')` | never (month lengths vary 28–31) | the 1st of each month |
| `every(n, 'months')` | `12 % n === 0` | January (e.g. `every(5,'months')` → 2-month gap) |

If you need a true fixed period, cron is the wrong tool — use a scheduler that tracks "last fired" timestamps.

## What's not included

- ❌ Natural language parsing
- ❌ Job scheduling / execution (use `node-cron`, `croner`)
- ❌ `cron.parse()`
- ❌ Seconds, year, or Quartz `L`/`W`/`#`
- ❌ Timezone handling (that's the scheduler's job)

## Errors

All validation errors are `CronsmithError` with a `code` field:

```ts
import { CronsmithError } from 'cronsmith';

try {
  cron().atHour(25);
} catch (e) {
  if (e instanceof CronsmithError && e.code === 'INVALID_HOUR') {
    // ...
  }
}
```

Codes:

- `INVALID_MINUTE` — minute value outside 0–59 (e.g. `.atMinute(60)`)
- `INVALID_HOUR` — hour value outside 0–23 (e.g. `.atHour(25)`)
- `INVALID_TIME` — malformed `HH:MM` string passed to `.at()` (e.g. `.at('9:00')` or `.at('25:00')`)
- `INVALID_DAY_OF_MONTH` — day value outside 1–31 (e.g. `.dayOfMonth(32)`)
- `INVALID_WEEKDAY` — unrecognized weekday name (e.g. `.on('funday')`)
- `INVALID_MONTH` — unrecognized month name (e.g. `.inMonth('smarch')`)
- `INVALID_STEP` — step value less than 1 or beyond the unit's max (e.g. `.every(0, 'hours')`, `.every(60, 'hours')`)
- `INVALID_RANGE` — out-of-bounds value passed to a `between*()` method (e.g. `.betweenHours(9, 24)`)
- `INVALID_UNIT` — unrecognized argument to `.every()` (e.g. `.every(5, 'seconds')`)
- `CONFLICTING_CALL` — the same field was set twice (e.g. `.atMinute(5).atMinute(10)`); see Rules for how soft defaults interact with this

## License

MIT
