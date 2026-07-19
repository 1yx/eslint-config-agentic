// Core code style: scoping, equality, braces, templates, etc. Plus re-enabling built-in
// unused-vars for plain JS (TS files use the @typescript-eslint version).

import { allCode, jsOnly } from './globs.mjs';

/** @param {{ files?: string[] }} [options] */
export default function coreStyle({ files } = {}) {
  return [
    {
      files: files ?? [allCode],
      rules: {
        // Delegate to @typescript-eslint/no-unused-vars on TS files.
        'no-unused-vars': 'off',
        'no-var': 'error',
        'prefer-const': ['error', { destructuring: 'all' }],
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        curly: ['error', 'all'],
        'object-shorthand': 'error',
        'prefer-template': 'error',
        'no-duplicate-imports': 'error',
        'no-unreachable': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-console': 'off',
        'no-debugger': 'warn',
      },
    },
    {
      // Plain JS has no TS unused-vars rule — use the built-in.
      files: [jsOnly],
      rules: {
        'no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
      },
    },
  ];
}
