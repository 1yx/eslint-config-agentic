// Filename naming conventions via check-file. Framework-neutral defaults (kebab for
// src/test/tests/scripts); add app/components or framework globs via `filenameConventions`.
// React/Next conventions live in templates/react.mjs, not here.

import { allCode } from './globs.mjs';
import { EXT } from './globs.mjs';

const DEFAULT_CONVENTIONS = {
  [`**/src/**/${EXT}`]: 'KEBAB_CASE',
  [`**/test/**/${EXT}`]: 'KEBAB_CASE',
  [`**/tests/**/${EXT}`]: 'KEBAB_CASE',
  [`**/scripts/**/${EXT}`]: 'KEBAB_CASE',
};

/**
 * @param {object} [options]
 * @param {Object<string, string>} [options.filenameConventions] - Extra glob → convention
 *   entries merged into the defaults (your keys win).
 * @param {string[]} [options.files]
 */
export default function checkFile({ filenameConventions = {}, files } = {}) {
  return {
    files: files ?? [allCode],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { ...DEFAULT_CONVENTIONS, ...filenameConventions },
        { ignoreMiddleExtensions: true },
      ],
    },
  };
}
