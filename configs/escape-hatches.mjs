// Ban TypeScript escape hatches in src — AI frequently uses `as` and `!` to silence
// type errors rather than handling them.
//
// The `new Date()` selector is re-declared here on purpose: flat config replaces a
// rule's array value wholesale, so without this, this src-scoped block would shadow
// the Date ban from configs/temporal.mjs (which covers src+tests+scripts) and silently
// un-ban Date in src.

export default {
  files: ['**/src/**/*.{js,mjs,cjs,ts,mts,cts}'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSAsExpression',
        message:
          'Avoid type assertions (as). Use a type guard, explicit annotation, or correct inference instead.',
      },
      {
        selector: 'TSNonNullExpression',
        message:
          'Avoid non-null assertions (!). Handle null/undefined explicitly or refine the type.',
      },
      {
        selector: "NewExpression[callee.name='Date']",
        message:
          'Use the Temporal API (Temporal.Now.zonedDateTimeISO(), Temporal.PlainDate.from(), etc.) instead of new Date().',
      },
    ],
  },
};
