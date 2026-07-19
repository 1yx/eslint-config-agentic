// Exclude the flat config file itself from type-aware parsing — it has no tsconfig
// entry, so project-based rules would error. Place this last so it overrides the
// type-aware rules from earlier blocks for eslint.config.* only.

export default function eslintConfigExclude() {
  return {
    files: ['eslint.config.{js,mjs,cjs}'],
    languageOptions: {
      parserOptions: { project: false },
    },
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  };
}
