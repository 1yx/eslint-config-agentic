// Force the Temporal API — ban `new Date()`, `Date.now()`, `Date.parse()`.
//
// Temporal is unambiguous, immutable-by-default, and timezone-aware. The legacy Date
// object has well-known footguns (mutable, month 0-indexed, implicit local-timezone
// coercion) that AI frequently mishandles. Shipped natively in Node 26+ (this config's
// minimum), Chrome 144, and Firefox 139.

export default {
  files: [
    '**/src/**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}',
    '**/tests/**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}',
    '**/scripts/**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}',
  ],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "NewExpression[callee.name='Date']",
        message:
          'Use the Temporal API (Temporal.Now.zonedDateTimeISO(), Temporal.PlainDate.from(), etc.) instead of new Date().',
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'Date',
        property: 'now',
        message: 'Use Temporal.Now.instant().epochMilliseconds instead of Date.now().',
      },
      {
        object: 'Date',
        property: 'parse',
        message:
          'Use Temporal.Instant.from(isoString).epochMilliseconds instead of Date.parse().',
      },
    ],
  },
};
