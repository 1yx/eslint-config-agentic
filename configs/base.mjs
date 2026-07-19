// Base infrastructure: ignore patterns, parser, plugins, globals.
//
// Every rule block assumes this is present (it provides the parser + plugin registry).
// Include it first in your flat config array, then add the rule blocks you want.

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import checkFile from 'eslint-plugin-check-file';
import globals from 'globals';
import agenticRules from '../rules/index.mjs';
import { allCode } from './globs.mjs';

/**
 * @param {object} [options]
 * @param {string} [options.tsconfigRootDir] - Dir with tsconfig.json for type-aware rules.
 * @param {string[]} [options.files] - Override the default all-code glob (e.g. to add tsx/jsx).
 */
export default function base({ tsconfigRootDir = process.cwd(), files } = {}) {
  return [
    {
      // Global ignores — no `files`, applies to everything.
      ignores: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/.next/**',
        '**/playwright-report/**',
        '**/test-results/**',
      ],
    },
    {
      files: files ?? [allCode],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
        parserOptions: {
          sourceType: 'module',
          ecmaVersion: 'latest',
          // Type-aware linting — required by promise-safety and the unsafe-* rules.
          project: true,
          tsconfigRootDir,
        },
        globals: {
          // Node + browser for full-stack coverage.
          ...globals.node,
          ...globals.browser,
        },
      },
      plugins: {
        '@typescript-eslint': tsPlugin,
        tsdoc: tsdocPlugin,
        jsdoc: jsdocPlugin,
        'check-file': checkFile,
        agentic: agenticRules,
      },
    },
  ];
}
