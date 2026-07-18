import type { EntryPoint } from '@src/types.js';

export type ResultName =
  | 'package-json'
  | 'check-syntax'
  | 'file-exists'
  | 'require'
  | 'import'
  | 'packlist'
  | 'entry-point-expansion'
  | 'unexpected-error';

export const enum ResultCode {
  Success,
  Error,
  Skip,
}

export type ResultDetails = {
  name: ResultName;
  code: ResultCode;
  message: string;
  // This will not be available if there is an error loading the package.json file.
  entryPoint?: EntryPoint;
  error?: Error | undefined;
};

export class Result {
  name: ResultName;

  code: ResultCode;

  message: string;

  entryPoint: EntryPoint | undefined;

  error: Error | undefined;

  constructor(details: ResultDetails) {
    this.name = details.name;
    this.code = details.code;
    this.message = details.message;
    this.entryPoint = details.entryPoint;
    this.error = details.error;
  }

  get [Symbol.toStringTag](): string {
    return `Result:${this.name}`;
  }
}
