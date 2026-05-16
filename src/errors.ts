import type { CronErrorCode } from './types.js';

export class CronsmithError extends Error {
  readonly code: CronErrorCode;

  constructor(code: CronErrorCode, message: string) {
    super(message);
    this.name = 'CronsmithError';
    this.code = code;
  }
}
