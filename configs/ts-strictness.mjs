// TypeScript strictness: type-only imports, `type` over `interface`, no require(),
// warn on `any` / unsafe-assignment / unsafe-return.

import { allCode } from './globs.mjs';

/** @param {{ files?: string[] }} [options] */
export default function tsStrictness({ files } = {}) {
  return {
    files: files ?? [allCode],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', disallowTypeAnnotations: false, fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-require-imports': 'error',
      // `??` over `||` for nullish defaults — `||` also swallows 0 / '' / false.
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      // AI throws strings/numbers instead of Error — loses stack trace and catch typing.
      '@typescript-eslint/only-throw-error': 'error',
    },
  };
}
