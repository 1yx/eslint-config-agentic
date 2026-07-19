// Template: Vue 3 project.
// Spreads the agentic preset (with .vue added to scope), then layers vue-eslint-parser
// (outer) + @typescript-eslint/parser (for <script>) on top, plus eslint-plugin-vue's
// recommended rules.
//
// Requires:
//   pnpm add -D eslint-plugin-vue vue-eslint-parser
//
// Since `files` here includes `.vue`, agentic's core TS/style rules already apply
// inside <script> — no re-declaration needed. The block below only adds the parser
// (vue-eslint-parser outer, @typescript-eslint/parser for <script>) plus Vue's template
// rules. Type-aware rules (no-explicit-any, unsafe-*, promise-safety) additionally need
// `project: true` + a tsconfig that lists .vue via extraFileExtensions.

import agentic from 'eslint-config-agentic';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import tsParser from '@typescript-eslint/parser';

const CODE = '*.{js,mjs,cjs,ts,mts,cts,vue}';

export default [
  ...agentic({
    files: [`**/${CODE}`],
    sourceFiles: [`**/src/**/${CODE}`],
    maxLinesPerFunction: { '**/*.vue': false },
  }),

  // Vue template + base script rules.
  ...vue.configs['flat/recommended'],

  // Parse .vue: vue-eslint-parser outer, @typescript-eslint/parser for <script>.
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        sourceType: 'module',
        ecmaVersion: 'latest',
        extraFileExtensions: ['.vue'],
        // project: true,  // type-aware: needs tsconfig include + extraFileExtensions
      },
    },
  },
];
