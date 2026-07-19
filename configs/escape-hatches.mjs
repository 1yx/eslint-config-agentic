// Ban TypeScript escape hatches in source — AI reaches for `as` and `!` to silence type
// errors. `as const` is always allowed (it only narrows). `!` is always banned.
//
// `as` is enforced by the `agentic/no-escape-assertion` rule, which takes an `allow` list
// of left-hand call patterns — the precise way to permit framework boundaries (JSON.parse,
// Response.json, drizzle) without disabling the rule globally. The Date selector is
// re-declared here because flat config replaces rule arrays wholesale — without it this
// block would shadow the temporal Date ban in source.

import { sourceDefault } from './globs.mjs';

/**
 * @param {object} [options]
 * @param {boolean|string[]} [options.allowAsAssertions=false] - `false` bans all `as`
 *   (except `as const`). `true` permits all. A string array (e.g. `['JSON.parse',
 *   'Response.json']`) permits `as` only on those left-hand call patterns — recommended
 *   for framework boundaries.
 * @param {string[]} [options.sourceFiles]
 */
export default function escapeHatches({ allowAsAssertions = false, sourceFiles } = {}) {
  // false  → rule on, empty allow (bans all `as`). true → rule off (permits all `as`).
  // [...]  → rule on, allow those call patterns.
  const asRule =
    allowAsAssertions === true
      ? {}
      : { 'agentic/no-escape-assertion': ['error', { allow: allowAsAssertions || [] }] };

  return {
    files: sourceFiles ?? [sourceDefault],
    rules: {
      ...asRule,
      'no-restricted-syntax': [
        'error',
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
