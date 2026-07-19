// Force the Temporal API — ban `new Date()`, `Date.now()`, `Date.parse()`.
// Scope defaults to source + tests + scripts; override via `sourceFiles` / `scriptFiles`.

import { sourceDefault, testsGlob, scriptsDefault } from './globs.mjs';

/**
 * @param {object} [options]
 * @param {string[]} [options.sourceFiles]
 * @param {string[]} [options.scriptFiles]
 */
export default function temporal({ sourceFiles, scriptFiles } = {}) {
  const source = sourceFiles ?? [sourceDefault];
  const script = scriptFiles ?? scriptsDefault;
  return {
    files: [...source, testsGlob, ...script],
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
}
