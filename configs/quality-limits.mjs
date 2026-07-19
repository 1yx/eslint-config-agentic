// Maintainability thresholds — all errors: ≤50 lines/function (logic), ≤500 lines/file,
// ≤4 nesting, ≤3 params, complexity ≤10.
//
// max-lines-per-function overrides are per-glob via `maxLinesPerFunction` (a
// { glob: false | number } map). Defaults to {} (framework-neutral — React/Vue relaxations
// live in templates/, not here).

import { allCode } from './globs.mjs';

/**
 * @param {object} [options]
 * @param {Object<string, (number|false)>} [options.maxLinesPerFunction] - Per-glob overrides.
 * @param {string[]} [options.files]
 */
export default function qualityLimits({ maxLinesPerFunction = {}, files } = {}) {
  const baseLimits = {
    files: files ?? [allCode],
    rules: {
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 4],
      'max-params': ['error', 3],
      complexity: ['error', 10],
    },
  };

  const overrideBlocks = Object.entries(maxLinesPerFunction).map(([glob, limit]) => ({
    files: [glob],
    rules: {
      'max-lines-per-function':
        limit === false
          ? 'off'
          : ['error', { max: limit, skipBlankLines: true, skipComments: true }],
    },
  }));

  return [baseLimits, ...overrideBlocks];
}
