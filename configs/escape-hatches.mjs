// Ban TypeScript escape hatches in source — AI reaches for `as` and `!` to silence type
// errors. `as const` is always allowed (it only narrows). `!` is always banned.
// `as` at framework boundaries (JSON.parse, Response.json, drizzle) opt-in via
// `allowAsAssertions`. The Date selector is re-declared here because flat config replaces
// rule arrays wholesale — without it this block would shadow the temporal Date ban in source.

import { sourceDefault } from './globs.mjs';

/**
 * @param {object} [options]
 * @param {boolean} [options.allowAsAssertions=false]
 * @param {string[]} [options.sourceFiles]
 */
export default function escapeHatches({ allowAsAssertions = false, sourceFiles } = {}) {
  const asSelector = allowAsAssertions
    ? []
    : [
        {
          selector: 'TSAsExpression[typeAnnotation.typeName.name!="const"]',
          message:
            'Avoid `as` assertions: use a type guard, explicit annotation, or correct inference instead. `as const` is always allowed; for framework boundaries (JSON.parse, Response.json, drizzle .set()/sql) opt in via allowAsAssertions: true.',
        },
      ];

  return {
    files: sourceFiles ?? [sourceDefault],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...asSelector,
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
}
