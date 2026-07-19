// Symbol naming conventions (camelCase vars/fns, PascalCase types, UPPER_CASE global
// const literals). The `agentic/global-literal-const-naming` rule needs the `agentic`
// plugin registered by `base()`.

import { allCode } from './globs.mjs';

/** @param {{ files?: string[] }} [options] */
export default function naming({ files } = {}) {
  return {
    files: files ?? [allCode],
    rules: {
      'agentic/global-literal-const-naming': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'variable', format: ['PascalCase', 'camelCase'], filter: { regex: 'Schema$', match: true } },
        { selector: 'variable', modifiers: ['const', 'global'], format: ['UPPER_CASE', 'camelCase'] },
        { selector: ['variable', 'function', 'parameter'], format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'property', format: null },
      ],
    },
  };
}
