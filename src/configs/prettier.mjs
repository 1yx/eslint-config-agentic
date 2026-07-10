import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

// Prettier runs as an ESLint rule so formatting failures surface in a single lint pass
// (usePrettierrc lets the consumer's .prettierrc drive options).

export const prettier = {
  files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
  plugins: {
    prettier: prettierPlugin,
  },
  rules: {
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
  },
};

// MUST be the last config block — disables every ESLint rule that conflicts with
// Prettier's formatting decisions so it wins over all earlier rule definitions.
export const prettierDisable = {
  ...eslintConfigPrettier,
};
