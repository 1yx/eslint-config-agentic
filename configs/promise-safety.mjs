// Type-aware Promise safety — AI agent code is overwhelmingly async. Requires type-aware
// parsing (project: true), provided by `base()`.

import { allCode } from './globs.mjs';

/** @param {{ files?: string[] }} [options] */
export default function promiseSafety({ files } = {}) {
  return {
    files: files ?? [allCode],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'warn',
      // `new Promise(async ...)` — the async executor silently swallows rejections.
      'no-async-promise-executor': 'error',
    },
  };
}
