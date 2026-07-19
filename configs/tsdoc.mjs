// TSDoc syntax validation at warn level.

import { allCode } from './globs.mjs';

/** @param {{ files?: string[] }} [options] */
export default function tsdoc({ files } = {}) {
  return {
    files: files ?? [allCode],
    rules: { 'tsdoc/syntax': 'warn' },
  };
}
