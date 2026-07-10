// Type-aware Promise safety — AI agent code is overwhelmingly async; these catch the
// most common failure modes. All require type-aware parsing (parserOptions.project),
// inherited from the base all-files config block in index.mjs.

export default {
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'],
  rules: {
    // Disallow unhandled floating Promises — the leading cause of silent failures in agents.
    '@typescript-eslint/no-floating-promises': 'error',
    // Disallow Promises in non-Promise positions, e.g. `if (asyncFn())`.
    '@typescript-eslint/no-misused-promises': 'error',
    // Disallow awaiting a value that is not actually a Promise.
    '@typescript-eslint/await-thenable': 'error',
    // Warn on async functions that contain no await expression.
    '@typescript-eslint/require-await': 'warn',
  },
};
