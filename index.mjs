// eslint-config-agentic — shareable ESLint flat config.
// Design goal: maximize consistency, type safety, and async correctness in AI-generated code.
//
// Usage (consumer's eslint.config.mjs):
//   import agentic from 'eslint-config-agentic';
//   export default agentic();
//
// Override the project root (only if eslint isn't run from your repo root):
//   export default agentic({ tsconfigRootDir: import.meta.dirname });
//
// Config blocks are split by concern under src/configs/; custom rule implementations
// live under src/rules/ (aggregated by src/index.mjs).

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsdocPlugin from 'eslint-plugin-tsdoc';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import checkFile from 'eslint-plugin-check-file';
import globals from 'globals';
import agenticRules from './src/index.mjs';
import temporal from './src/configs/temporal.mjs';
import qualityLimits from './src/configs/quality-limits.mjs';
import escapeHatches from './src/configs/escape-hatches.mjs';
import promiseSafety from './src/configs/promise-safety.mjs';
import { prettier, prettierDisable } from './src/configs/prettier.mjs';

/**
 * Build the ESLint flat config array.
 *
 * @param {object} [options]
 * @param {string} [options.tsconfigRootDir] - Directory containing the consumer's tsconfig.json.
 *   Defaults to `process.cwd()` (the repo root when running `eslint .`).
 * @returns {Array<object>} ESLint flat config array.
 */
export default function agenticEslintConfig({ tsconfigRootDir = process.cwd() } = {}) {
  return [
    {
      // Ignore build artifacts and third-party dependencies to reduce noise.
      ignores: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'playwright-report/**',
        'test-results/**',
        'openspec/changes/archive/**',
        '.opencode/**',
        'codegen/**',
      ],
    },

    // ========== Base: parser, plugins, naming, core style, TS strictness, TSDoc ==========
    {
      files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],

      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
        parserOptions: {
          sourceType: 'module',
          ecmaVersion: 'latest',
          // Enable type-aware linting — required by configs/promise-safety.mjs and the
          // unsafe-* rules below. Without this, the most valuable rules are silently disabled.
          project: true,
          tsconfigRootDir,
        },
        globals: {
          // Pull in the full Node.js global set (process, Buffer, setTimeout, etc.).
          ...globals.node,
        },
      },

      plugins: {
        '@typescript-eslint': tsPlugin,
        tsdoc: tsdocPlugin,
        jsdoc: jsdocPlugin,
        'check-file': checkFile,
      },

      rules: {
        // ========== Naming Conventions ==========
        //
        // | Rule                                       | Behavior                                                          |
        // |--------------------------------------------|-------------------------------------------------------------------|
        // | `agentic/global-literal-const-naming`      | Global const + literal init → UPPER_SNAKE_CASE                    |
        // | `naming-convention` global const            | UPPER_CASE or camelCase (complex objects exempt via custom rule)  |
        // | `naming-convention` variable/function/param | camelCase, leading underscore allowed                             |
        // | `naming-convention` property                | Skipped (HTTP headers, i18n keys, API response fields)            |
        // | `naming-convention` typeLike                | PascalCase (class, interface, type alias, enum)                   |
        // | `check-file/filename-naming-convention`     | kebab-case for src/test/scripts files                             |

        // Global const with literal values must be UPPER_SNAKE_CASE.
        'agentic/global-literal-const-naming': 'error',

        // Enforce symbol naming conventions.
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: 'variable', format: ['PascalCase', 'camelCase'], filter: { regex: 'Schema$', match: true } },
          { selector: 'variable', modifiers: ['const', 'global'], format: ['UPPER_CASE', 'camelCase'] },
          { selector: ['variable', 'function', 'parameter'], format: ['camelCase'], leadingUnderscore: 'allow' },
          { selector: 'property', format: null },
        ],

        // Enforce kebab-case filenames in src/test/scripts.
        'check-file/filename-naming-convention': [
          'error',
          {
            'src/**/*.{js,mjs,cjs,ts,mts,cts}': 'KEBAB_CASE',
            'test/**/*.{js,mjs,cjs,ts,mts,cts}': 'KEBAB_CASE',
            'tests/**/*.{js,mjs,cjs,ts,mts,cts}': 'KEBAB_CASE',
            'scripts/**/*.{js,mjs,cjs,ts,mts,cts}': 'KEBAB_CASE',
          },
          { ignoreMiddleExtensions: true },
        ],

        // ========== Core Code Style ==========

        // Delegate unused-var enforcement to the TS version to avoid duplicate reports.
        'no-unused-vars': 'off',
        // Disallow var — block scoping prevents implicit hoisting surprises.
        'no-var': 'error',
        // Prefer const everywhere possible to reduce mutable-state cognitive load.
        'prefer-const': ['error', { destructuring: 'all' }],
        // Always use strict equality; null is the only exception (x == null catches undefined too).
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        // Require braces on all control-flow branches — AI frequently omits them on single-liners.
        curly: ['error', 'all'],
        // Enforce object method/property shorthand for consistent output shape.
        'object-shorthand': 'error',
        // Enforce template literals over string concatenation to eliminate style forks.
        'prefer-template': 'error',
        // Disallow duplicate imports — reduces redundant context in AI-generated files.
        'no-duplicate-imports': 'error',
        // Disallow unreachable code — prevents AI from emitting dead branches.
        'no-unreachable': 'error',
        // Disallow unsafe optional chaining patterns that collapse at runtime.
        'no-unsafe-optional-chaining': 'error',
        // Allow console — CLI/automation projects legitimately rely on process logs.
        'no-console': 'off',
        // Warn on debugger statements so they can't silently land in production.
        'no-debugger': 'warn',

        // ========== TypeScript strictness ==========

        // Unused variables: allow _ prefix as an intentional discard marker.
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],

        // Enforce type-only imports to prevent accidental runtime-side-effect imports.
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            prefer: 'type-imports',
            disallowTypeAnnotations: false,
            fixStyle: 'inline-type-imports',
          },
        ],

        // Unify on `type` aliases — mixing interface and type creates unnecessary style forks.
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

        // Disallow implicit require() calls — keeps ESM semantics consistent throughout.
        '@typescript-eslint/no-require-imports': 'error',

        // Warn on explicit `any` — AI habitually reaches for any to silence type errors.
        '@typescript-eslint/no-explicit-any': 'warn',

        // Disallow assigning values typed as `any` — catches the silent spread of any.
        '@typescript-eslint/no-unsafe-assignment': 'warn',

        // Disallow returning `any` from functions — keeps return types trustworthy.
        '@typescript-eslint/no-unsafe-return': 'warn',

        // ========== TSDoc ==========

        // Validate TSDoc comment syntax at warn level.
        'tsdoc/syntax': 'warn',
      },
    },

    // ========== Quality limits (max lines / depth / params / complexity) ==========
    qualityLimits,

    // ========== Type-aware Promise safety ==========
    promiseSafety,

    // ========== Prettier as an ESLint rule ==========
    prettier,

    // ========== Agent semantic guardrails (inlined custom rules) ==========
    {
      // Catches patterns typescript-eslint cannot detect structurally: empty catch
      // blocks, `array.map(async ...)` returning Promise[], overly broad catch types,
      // and hardcoded secrets. `no-eval` is ESLint's built-in.
      files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
      plugins: {
        agentic: agenticRules,
      },
      rules: {
        'agentic/no-empty-catch': 'error',
        'agentic/no-async-array-callback': 'warn',
        'agentic/no-broad-exception': 'warn',
        'agentic/no-hardcoded-secret': 'error',
        'no-eval': 'error',
      },
    },

    // ========== Force Temporal API (ban Date) in src/tests/scripts ==========
    temporal,

    // ========== Ban `as` / `!` escape hatches in src ==========
    escapeHatches,

    // ========== Require JSDoc/TSDoc on src declarations ==========
    {
      files: ['src/**/*.{js,mjs,cjs,ts,mts,cts}'],
      rules: {
        'jsdoc/require-jsdoc': [
          'warn',
          {
            require: {
              FunctionDeclaration: true,
              FunctionExpression: true,
              // Exclude arrow functions — short callbacks and inline transforms are too noisy.
              ArrowFunctionExpression: false,
              ClassDeclaration: true,
              MethodDefinition: true,
            },
            contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
            checkAllFunctionExpressions: false,
            // Enforce on all declarations, not just exported ones — internal logic also benefits.
            publicOnly: false,
          },
        ],
      },
    },

    // ========== Exclude the flat config file itself from type-aware parsing ==========
    {
      files: ['eslint.config.{js,mjs,cjs}'],
      languageOptions: {
        parserOptions: {
          project: false,
        },
      },
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/await-thenable': 'off',
        '@typescript-eslint/require-await': 'off',
      },
    },

    // ========== Relax limits in scripts/ ==========
    {
      // One-off utilities and debug tools, not production code paths.
      // Core safety rules (types, async, imports) still apply.
      files: [
        'scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
        'src/scripts/**/*.{js,mjs,cjs,ts,mts,cts}',
      ],
      rules: {
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        complexity: 'off',
        'max-params': 'off',
        'max-depth': 'off',
        'jsdoc/require-jsdoc': 'off',
      },
    },

    // ========== Re-enable built-in unused-vars for plain JS ==========
    {
      // TS files use @typescript-eslint/no-unused-vars; this covers plain JS.
      files: ['**/*.{js,mjs,cjs}'],
      rules: {
        'no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
      },
    },

    // ========== Prettier conflict disable (MUST be last) ==========
    prettierDisable,
  ];
}
