// Ban TypeScript escape hatches in src — AI frequently uses `as` and `!` to silence
// type errors rather than handling them.
//
// `as const` is intentionally excluded from the ban: it only narrows a value's type
// (never widens), so it is never an escape hatch. Some frameworks genuinely need `as`
// at their type boundary because the type system cannot express the return shape —
// `JSON.parse()`, `Response.json()`, and drizzle's dynamic `.set()` / `sql` tag return
// `unknown` or `SQL<unknown>`. For projects using those, opt in with
// `agentic({ allowAsAssertions: true })`. Non-null assertions (`!`) stay banned
// either way — they are almost always a real null-handling bug, not a boundary artifact.
//
// The `new Date()` selector is re-declared here on purpose: flat config replaces a
// rule's array value wholesale, so without this, this src-scoped block would shadow
// the Date ban from configs/temporal.mjs (which covers src+tests+scripts) and silently
// un-ban Date in src.

/**
 * Build the src-scoped escape-hatch config block.
 *
 * @param {object} [options]
 * @param {boolean} [options.allowAsAssertions=false] - Permit `as` assertions at
 *   framework type boundaries (`JSON.parse`, `Response.json`, drizzle `.set()`/`sql`,
 *   etc.) where the framework's types are genuinely `unknown`. `as const` is always
 *   allowed regardless; `!` (non-null) is always banned.
 * @returns {object} ESLint flat-config block.
 */
export default function escapeHatches({ allowAsAssertions = false } = {}) {
  const asSelector = allowAsAssertions
    ? []
    : [
        {
          selector: 'TSAsExpression[typeAnnotation.typeName.name!="const"]',
          message:
            'Avoid `as` assertions: use a type guard, explicit annotation, or correct inference instead. `as const` is always allowed; for framework boundaries (JSON.parse, Response.json, drizzle .set()/sql) opt in via agentic({ allowAsAssertions: true }).',
        },
      ];

  return {
    files: ['**/src/**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'],
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
