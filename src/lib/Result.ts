import type { EntryPoint } from '@src/types.js';

export type ResultName = 'package-json' | 'check-syntax' | 'file-exists' | 'require' | 'import' | 'packlist';

export const enum ResultCode {
  Success,
  Error,
  Skip,
}

export type ResultDetails = {
  name: ResultName;
  code: ResultCode;
  message: string;
  entryPoint: EntryPoint;
  error?: Error | undefined;
};

export class Result {
  name: ResultName;

  code: ResultCode;

  message: string;

  entryPoint: EntryPoint;

  error: Error | undefined;

  constructor(details: ResultDetails) {
    this.name = details.name;
    this.code = details.code;
    this.message = details.message;
    this.entryPoint = details.entryPoint;
    this.error = details.error;
  }

  toString(): string {
    const emoji = this.code === ResultCode.Success ? '✅' : this.code === ResultCode.Error ? '❌' : '😐';

    if (this.code === ResultCode.Error) {
      const itemPath = this.entryPoint.itemPath.length ? ` (${JSON.stringify(this.entryPoint.itemPath)})` : '';

      return `${emoji} ${this.name}: ${this.message}${itemPath} ${this.error ?? ''}`.trim();
    } else {
      return `${emoji} ${this.name}: ${this.message}`;
    }
  }
}
