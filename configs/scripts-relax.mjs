// Relax quality limits and JSDoc for one-off scripts (not production code paths).
// Core safety rules (types, async, imports) still apply via the other blocks.

import { scriptsDefault } from './globs.mjs';

/** @param {object} [options]
 * @param {string[]} [options.scriptFiles] - Globs for scripts (default scripts/ + src/scripts/). */
export default function scriptsRelax({ scriptFiles } = {}) {
  return {
    files: scriptFiles ?? scriptsDefault,
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      complexity: 'off',
      'max-params': 'off',
      'max-depth': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  };
}
