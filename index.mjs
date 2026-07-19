// eslint-config-agentic — framework-neutral, composable ESLint flat config for
// AI-generated TypeScript.
//
// Two ways to use:
//
//   1. Preset (everything on, one call):
//        import agentic from 'eslint-config-agentic';
//        export default agentic();
//
//   2. Compose (pick the blocks you want — `base()` first, it provides parser + plugins):
//        import { base, temporal, promiseSafety } from 'eslint-config-agentic';
//        export default [base(), temporal(), promiseSafety()];
//
// Each block is a function returning a flat-config object (or array). `base()` registers
// the parser and all plugins; rule blocks depend on it, so include `base()` first.
// tsx/jsx are deliberately absent from defaults — React/Vue opt in via `files` or the
// templates in ./templates/.

import base from './configs/base.mjs';
import coreStyle from './configs/core-style.mjs';
import naming from './configs/naming.mjs';
import checkFile from './configs/check-file.mjs';
import tsStrictness from './configs/ts-strictness.mjs';
import tsdoc from './configs/tsdoc.mjs';
import promiseSafety from './configs/promise-safety.mjs';
import agentGuardrails from './configs/agent-guardrails.mjs';
import qualityLimits from './configs/quality-limits.mjs';
import temporal from './configs/temporal.mjs';
import escapeHatches from './configs/escape-hatches.mjs';
import jsdoc from './configs/jsdoc.mjs';
import scriptsRelax from './configs/scripts-relax.mjs';
import eslintConfigExclude from './configs/eslint-config-exclude.mjs';

// Named exports — compose your own config from these.
export {
  base,
  coreStyle,
  naming,
  checkFile,
  tsStrictness,
  tsdoc,
  promiseSafety,
  agentGuardrails,
  qualityLimits,
  temporal,
  escapeHatches,
  jsdoc,
  scriptsRelax,
  eslintConfigExclude,
};

/**
 * Preset: every block enabled, framework-neutral defaults. Equivalent to composing all
 * named exports. Options thread through to the relevant blocks.
 *
 * @param {object} [options]
 * @param {string} [options.tsconfigRootDir] - Dir with tsconfig.json. Defaults to cwd.
 * @param {string[]} [options.files] - Override the all-code glob (add tsx/jsx for React).
 * @param {string[]} [options.sourceFiles] - Source globs for Temporal/escape-hatch/jsdoc.
 * @param {string[]} [options.scriptFiles] - Script globs for scripts-relax + Temporal.
 * @param {Object<string, string>} [options.filenameConventions] - Extra check-file entries.
 * @param {Object<string, (number|false)>} [options.maxLinesPerFunction] - Per-glob overrides.
 * @param {boolean} [options.allowAsAssertions=false] - Permit `as` at framework boundaries.
 * @returns {Array<object>} ESLint flat config array.
 */
export default function agentic(options = {}) {
  const { files } = options;
  return [
    ...base(options),
    ...coreStyle({ files }),
    naming({ files }),
    checkFile(options),
    tsStrictness({ files }),
    tsdoc({ files }),
    promiseSafety({ files }),
    agentGuardrails({ files }),
    ...qualityLimits({ ...options, files }),
    temporal(options),
    escapeHatches(options),
    jsdoc(options),
    scriptsRelax(options),
    eslintConfigExclude(),
  ];
}
