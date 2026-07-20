// ESLint config for the type-aware no-broad-exception fixture test.
// Loaded automatically because the ESLint class runs with cwd = this directory.
import tsParser from '@typescript-eslint/parser';
import noBroadException from '../../rules/no-broad-exception.mjs';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: 'tsconfig.json', tsconfigRootDir: import.meta.dirname },
    },
    plugins: { agentic: { rules: { 'no-broad-exception': noBroadException } } },
    rules: { 'agentic/no-broad-exception': 'error' },
  },
];
