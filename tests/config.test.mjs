// Config-assembly tests for the 0.2.0 composable structure: named block exports,
// the agentic() preset, framework-neutral defaults (no tsx/jsx), and option threading.

import test from 'node:test';
import assert from 'node:assert/strict';

import agentic, {
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
} from '../index.mjs';

test('all fourteen blocks are exported as functions', () => {
  for (const fn of [
    base, coreStyle, naming, checkFile, tsStrictness, tsdoc, promiseSafety,
    agentGuardrails, qualityLimits, temporal, escapeHatches, jsdoc, scriptsRelax,
    eslintConfigExclude,
  ]) {
    assert.equal(typeof fn, 'function');
  }
});

test('base() returns ignores + parser/plugins block with framework-neutral files', () => {
  const [ignores, main] = base();
  assert.ok(Array.isArray(ignores.ignores), 'first entry is the global ignores block');
  assert.deepEqual(main.files, ['**/*.{js,mjs,cjs,ts,mts,cts}'], 'default files exclude tsx/jsx');
  assert.ok(main.plugins['@typescript-eslint'], 'registers @typescript-eslint');
  assert.ok(main.plugins.agentic, 'registers agentic');
  assert.ok(main.plugins['check-file'], 'registers check-file');
});

test('base({ files }) overrides the all-code glob', () => {
  const [, main] = base({ files: ['**/*.{ts,tsx}'] });
  assert.deepEqual(main.files, ['**/*.{ts,tsx}']);
});

test('agentic() preset composes all blocks', () => {
  const cfg = agentic();
  assert.ok(cfg.find((b) => b.rules?.['no-var'] === 'error'), 'coreStyle');
  assert.ok(cfg.find((b) => b.rules?.['@typescript-eslint/no-explicit-any'] === 'warn'), 'tsStrictness');
  assert.ok(cfg.find((b) => b.rules?.['@typescript-eslint/no-floating-promises'] === 'error'), 'promiseSafety');
  assert.ok(cfg.find((b) => b.rules?.['agentic/no-empty-catch'] === 'error'), 'agentGuardrails');
  assert.ok(cfg.find((b) => b.rules?.['no-restricted-properties']), 'temporal');
  assert.ok(cfg.find((b) => b.rules?.['jsdoc/require-jsdoc']), 'jsdoc');
  assert.ok(cfg.find((b) => b.rules?.['max-lines']), 'qualityLimits');
  assert.ok(cfg.find((b) => b.files?.[0] === 'eslint.config.{js,mjs,cjs}'), 'eslintConfigExclude');
});

test('agentic() default files are framework-neutral (no tsx/jsx anywhere)', () => {
  const cfg = agentic();
  const tsBlock = cfg.find((b) => b.rules?.['@typescript-eslint/no-explicit-any'] === 'warn');
  assert.deepEqual(tsBlock.files, ['**/*.{js,mjs,cjs,ts,mts,cts}']);
});

test('agentic({ files }) threads through to all-code blocks', () => {
  const cfg = agentic({ files: ['**/*.{ts,tsx,vue}'] });
  const tsBlock = cfg.find((b) => b.rules?.['@typescript-eslint/no-explicit-any'] === 'warn');
  assert.deepEqual(tsBlock.files, ['**/*.{ts,tsx,vue}']);
});

test('compose: base() + selected blocks assembles a valid partial config', () => {
  const cfg = [...base(), ...coreStyle(), temporal()];
  assert.ok(cfg.find((b) => b.ignores), 'base ignores');
  assert.ok(cfg.find((b) => b.rules?.['no-var'] === 'error'), 'coreStyle');
  assert.ok(cfg.find((b) => b.rules?.['no-restricted-properties']), 'temporal');
});

test('escapeHatches: default bans `as` (minus const) and `!`, keeps Date', () => {
  const block = escapeHatches();
  const has = (sel) => block.rules['no-restricted-syntax'].some((s) => s.selector === sel);
  assert.equal(has('TSAsExpression[typeAnnotation.typeName.name!="const"]'), true);
  assert.equal(has('TSNonNullExpression'), true);
  assert.equal(has("NewExpression[callee.name='Date']"), true);
});

test('escapeHatches: allowAsAssertions drops only the `as` selector', () => {
  const block = escapeHatches({ allowAsAssertions: true });
  const has = (sel) => block.rules['no-restricted-syntax'].some((s) => s.selector === sel);
  assert.equal(has('TSAsExpression[typeAnnotation.typeName.name!="const"]'), false);
  assert.equal(has('TSNonNullExpression'), true);
  assert.equal(has("NewExpression[callee.name='Date']"), true);
});

test('temporal() defaults to source + tests + scripts', () => {
  const block = temporal();
  assert.ok(block.files.some((f) => f.startsWith('**/src/**')));
  assert.ok(block.files.some((f) => f.startsWith('**/tests/**')));
  assert.ok(block.files.some((f) => f.startsWith('**/scripts/**')));
  assert.ok(!block.files.some((f) => f.includes('tsx')), 'no tsx in defaults');
});

test('agentic({ maxLinesPerFunction }): per-glob overrides generate blocks', () => {
  const cfg = agentic({ maxLinesPerFunction: { '**/*.vue': 100 } });
  const vue = cfg.find((b) => b.files?.includes('**/*.vue'));
  assert.deepEqual(vue.rules['max-lines-per-function'], [
    'error',
    { max: 100, skipBlankLines: true, skipComments: true },
  ]);
});

test('agentic({ filenameConventions }): merges into check-file defaults', () => {
  const cfg = agentic({ filenameConventions: { '*.ts': 'KEBAB_CASE' } });
  const block = cfg.find((b) => b.rules?.['check-file/filename-naming-convention']);
  const map = block.rules['check-file/filename-naming-convention'][1];
  assert.equal(map['*.ts'], 'KEBAB_CASE', 'user entry merged');
  assert.equal(map['**/src/**/*.{js,mjs,cjs,ts,mts,cts}'], 'KEBAB_CASE', 'defaults preserved');
  assert.ok(!('**/app/**/*.{tsx,jsx}' in map), 'React app/ convention removed from defaults');
});

test('agentic({ sourceFiles }): threads to temporal, escapeHatches, and jsdoc', () => {
  const cfg = agentic({ sourceFiles: ['**/app/**/*.{ts,tsx}'] });
  const jsdocBlock = cfg.find((b) => b.rules?.['jsdoc/require-jsdoc']);
  assert.deepEqual(jsdocBlock.files, ['**/app/**/*.{ts,tsx}']);
});

test('agentic({ scriptFiles }): threads to scriptsRelax', () => {
  const cfg = agentic({ scriptFiles: ['**/tools/**/*.{ts}'] });
  const relax = cfg.find((b) => b.rules?.['max-lines'] === 'off');
  assert.deepEqual(relax.files, ['**/tools/**/*.{ts}']);
});
