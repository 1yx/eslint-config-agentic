// Config-assembly tests for the 0.1.3 options: the escape-hatch `allowAsAssertions`
// toggle and the React max-lines-per-function relaxation. Driven over node:test,
// zero extra deps. The inlined custom rules are covered in tests/rules.test.mjs.

import test from 'node:test';
import assert from 'node:assert/strict';

import agentic from '../index.mjs';
import escapeHatches from '../configs/escape-hatches.mjs';

const hasRule = (block, rule, value) => block.rules?.[rule] === value;
const hasSelector = (block, selector) =>
  block.rules?.['no-restricted-syntax']?.some((s) => s.selector === selector);

test('escapeHatches: default bans `as` (minus `as const`) and `!`, keeps Date', () => {
  const block = escapeHatches();
  assert.equal(hasSelector(block, 'TSAsExpression[typeAnnotation.typeName.name!="const"]'), true);
  assert.equal(hasSelector(block, 'TSNonNullExpression'), true);
  assert.equal(hasSelector(block, "NewExpression[callee.name='Date']"), true);
});

test('escapeHatches: allowAsAssertions drops only the `as` selector', () => {
  const block = escapeHatches({ allowAsAssertions: true });
  assert.equal(hasSelector(block, 'TSAsExpression[typeAnnotation.typeName.name!="const"]'), false);
  // `!` and Date stay banned even when `as` is allowed.
  assert.equal(hasSelector(block, 'TSNonNullExpression'), true);
  assert.equal(hasSelector(block, "NewExpression[callee.name='Date']"), true);
});

test('agentic(): React .tsx/.jsx relaxes max-lines-per-function to off', () => {
  const config = agentic();
  const reactBlock = config.find(
    (b) => b.files?.includes('**/*.{tsx,jsx}') && hasRule(b, 'max-lines-per-function', 'off'),
  );
  assert.ok(reactBlock, 'expected a React-scoped block turning max-lines-per-function off');
});

test('agentic(): base 50-line limit still applies to non-React files', () => {
  const config = agentic();
  const base = config.find(
    (b) =>
      b.files?.includes('**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}') &&
      Array.isArray(b.rules?.['max-lines-per-function']) &&
      b.rules['max-lines-per-function'][1].max === 50,
  );
  assert.ok(base, 'expected the base 50-line cap to remain for logic files');
});

test('agentic(): allowAsAssertions threads through to the assembled config', () => {
  const off = agentic({ allowAsAssertions: false });
  const on = agentic({ allowAsAssertions: true });
  const countAs = (cfg) =>
    cfg.filter((b) => hasSelector(b, 'TSAsExpression[typeAnnotation.typeName.name!="const"]')).length;
  assert.equal(countAs(off), 1, 'default config bans `as`');
  assert.equal(countAs(on), 0, 'opted-in config permits `as`');
});
