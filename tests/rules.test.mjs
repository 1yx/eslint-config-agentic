// Rule unit tests, driven by ESLint's RuleTester over node:test (zero extra deps).
//
//   pnpm test    # or: node --test tests/

import test from 'node:test';
import assert from 'node:assert/strict';
import { RuleTester, ESLint } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';

import noEmptyCatch from '../rules/no-empty-catch.mjs';
import noAsyncArrayCallback from '../rules/no-async-array-callback.mjs';
import noBroadException from '../rules/no-broad-exception.mjs';
import noHardcodedSecret from '../rules/no-hardcoded-secret.mjs';
import globalLiteralConstNaming from '../rules/global-literal-const-naming.mjs';
import noEscapeAssertion from '../rules/no-escape-assertion.mjs';
import noWeakRandomnessForSecrets from '../rules/no-weak-randomness-for-secrets.mjs';
import noRedundantLogic from '../rules/no-redundant-logic.mjs';
import noLlmArtifacts from '../rules/no-llm-artifacts.mjs';
import noSwallowedErrors from '../rules/no-swallowed-errors.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

test('no-empty-catch', () => {
  ruleTester.run('no-empty-catch', noEmptyCatch, {
    valid: [
      'try { f() } catch (e) { console.log(e); }',
      'try { f() } catch (e) { /* intentionally empty */ }',
    ],
    invalid: [
      { code: 'try { f() } catch (e) {}', errors: [{ messageId: 'emptyCatch' }] },
      { code: 'try { f() } catch {}', errors: [{ messageId: 'emptyCatch' }] },
    ],
  });
});

test('no-async-array-callback', () => {
  ruleTester.run('no-async-array-callback', noAsyncArrayCallback, {
    valid: [
      '[1,2,3].map((n) => n);', // sync callback — fine
      'Promise.all([1,2,3].map(async (n) => n));', // wrapped in combinator — fine
      'const xs = [1,2,3].map(async (n) => n); Promise.all(xs);', // assign-then-consume — fine
    ],
    invalid: [
      { code: '[1,2,3].map(async (n) => n);', errors: [{ messageId: 'asyncArrayCallback' }] },
      { code: '[1,2,3].forEach(async (n) => console.log(n));', errors: [{ messageId: 'asyncArrayCallback', data: { method: 'forEach' } }] },
    ],
  });
});

test('no-broad-exception', () => {
  ruleTester.run('no-broad-exception', noBroadException, {
    valid: [
      'try { f() } catch (e) { console.log(e); }', // no annotation
      'try { f() } catch (e: unknown) { if (e instanceof Error) console.log(e); }', // narrowed
    ],
    invalid: [
      { code: 'try { f() } catch (e: any) { console.log(e); }', errors: [{ messageId: 'broadException', data: { type: 'any' } }] },
      { code: 'try { f() } catch (e: unknown) { console.log(e); }', errors: [{ messageId: 'broadException', data: { type: 'unknown' } }] },
    ],
  });
});

test('no-broad-exception (type-aware): custom type guards narrow, plain booleans do not', async () => {
  // RuleTester's virtual file (estree.ts) is rejected by tsconfig include checks, so we
  // drive the ESLint class over real fixture files under tests/fixtures/ instead.
  const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));
  const eslint = new ESLint({ cwd: fixturesDir });
  const results = await eslint.lintFiles(['guard.ts', 'plain.ts']);
  const file = (name) => results.find((r) => r.filePath.endsWith(name));
  const hits = (r) => r.messages.filter((m) => m.ruleId === 'agentic/no-broad-exception');
  assert.equal(hits(file('guard.ts')).length, 0, 'custom type guard (`e is T`) narrows → not flagged');
  assert.equal(hits(file('plain.ts')).length, 1, 'plain boolean fn is NOT a type guard → still flagged');
});

test('no-hardcoded-secret', () => {
  ruleTester.run('no-hardcoded-secret', noHardcodedSecret, {
    valid: [
      'const apiKey = process.env.API_KEY;', // env var — fine
      'const label = "not-a-secret";', // name doesn't suggest a secret
      'const apiKey = "short";', // too short (< 8) — fine
      'const apiKey = "changeme";', // known placeholder — fine
    ],
    invalid: [
      { code: "const apiKey = 'sk-prod-1234567890abcdef';", errors: [{ messageId: 'hardcodedSecret' }] },
      { code: 'const password = "supersecretvalue";', errors: [{ messageId: 'hardcodedSecret' }] },
      { code: 'const cfg = { authToken: "abcdef123456" };', errors: [{ messageId: 'hardcodedSecret' }] },
    ],
  });
});

test('global-literal-const-naming', () => {
  ruleTester.run('global-literal-const-naming', globalLiteralConstNaming, {
    valid: [
      'const MAX_RETRIES = 3;', // already UPPER_SNAKE
      'export const BASE_URL = "https://example.com";', // exported + UPPER — fine
      'const schema = buildSchema();', // non-literal init — exempt
      'function f() { const x = 1; }', // not global
    ],
    invalid: [
      { code: 'const retryCount = 5;', errors: [{ messageId: 'upperSnake' }] },
      { code: 'export const retryCount = 5;', errors: [{ messageId: 'upperSnake' }] }, // exported too
      { code: 'const name = "agent";', errors: [{ messageId: 'upperSnake' }] },
    ],
  });
});

test('no-escape-assertion', () => {
  ruleTester.run('no-escape-assertion', noEscapeAssertion, {
    valid: [
      'const x = { a: 1 } as const;', // as const — always allowed
      'maybe!;', // non-null assertion is a different rule
      'const x = foo;', // no `as` at all
      { code: 'const d = JSON.parse(raw) as T;', options: [{ allow: ['JSON.parse'] }] },
      { code: 'const r = (await res.json()) as R;', options: [{ allow: ['res.json'] }] },
    ],
    invalid: [
      { code: 'const x = foo as string;', errors: [{ messageId: 'escapeAssertion' }] }, // no allow
      {
        // allow set, but foo isn't in it
        code: 'const x = foo as string;',
        options: [{ allow: ['JSON.parse'] }],
        errors: [{ messageId: 'escapeAssertion' }],
      },
      {
        // JSON.parse not allowlisted here
        code: 'const d = JSON.parse(raw) as T;',
        errors: [{ messageId: 'escapeAssertion' }],
      },
      {
        // allow has Response.json, not JSON.parse
        code: 'const d = JSON.parse(raw) as T;',
        options: [{ allow: ['Response.json'] }],
        errors: [{ messageId: 'escapeAssertion' }],
      },
      {
        // double assertion `as unknown as` — dedicated message, never allowed
        code: 'const c = value as unknown as Config;',
        errors: [{ messageId: 'doubleAssertion' }],
      },
    ],
  });
});

test('no-weak-randomness-for-secrets', () => {
  ruleTester.run('no-weak-randomness-for-secrets', noWeakRandomnessForSecrets, {
    valid: [
      'const count = Math.random();', // not a secret name
      'const apiKey = crypto.randomBytes(16).toString("hex");', // CSPRNG, not Math.random
      'const r = Math.random();', // 'r' is not sensitive
    ],
    invalid: [
      { code: 'const apiKey = Math.random();', errors: [{ messageId: 'weakRandom' }] },
      { code: 'const sessionToken = Math.random();', errors: [{ messageId: 'weakRandom' }] },
      { code: 'obj.password = Math.random();', errors: [{ messageId: 'weakRandom' }] },
      { code: 'const cfg = { token: Math.random() };', errors: [{ messageId: 'weakRandom' }] },
    ],
  });
});

test('no-redundant-logic', () => {
  ruleTester.run('no-redundant-logic', noRedundantLogic, {
    valid: [
      'if (x) f();',
      'const y = x === other;', // both sides real
      'const y = x === 5;', // numeric literal, not boolean
      'const y = x ? a : b;', // non-boolean branches
    ],
    invalid: [
      { code: 'if (x === true) f();', errors: [{ messageId: 'boolCompare' }] },
      { code: 'const y = flag === false;', errors: [{ messageId: 'boolCompare' }] },
      { code: 'const y = x ? true : false;', errors: [{ messageId: 'boolTernary' }] },
      { code: 'const y = x ? false : true;', errors: [{ messageId: 'boolTernary' }] },
    ],
  });
});

test('no-llm-artifacts', () => {
  ruleTester.run('no-llm-artifacts', noLlmArtifacts, {
    valid: [
      'const x = 1;', // no comment
      '// TODO: refactor this', // not attribution
      '/* regular block comment */',
    ],
    invalid: [
      { code: '// Generated by Claude\nconst x = 1;', errors: [{ messageId: 'llmArtifact' }] },
      { code: '/* Created with ChatGPT */\nconst x = 1;', errors: [{ messageId: 'llmArtifact' }] },
      { code: '// AI-generated helper\nfunction f() {}', errors: [{ messageId: 'llmArtifact' }] },
    ],
  });
});

test('no-swallowed-errors', () => {
  ruleTester.run('no-swallowed-errors', noSwallowedErrors, {
    valid: [
      'try { f() } catch (e) { console.log(e); return { error: e }; }', // returns an error result
      'try { f() } catch (e) { throw new Error("x", { cause: e }); }', // rethrows
      'try { f() } catch (e) { logger.error(e); }', // not console.*
      'try { f() } catch (e) {}', // empty → handled by no-empty-catch
    ],
    invalid: [
      { code: 'try { f() } catch (e) { console.log(e); }', errors: [{ messageId: 'swallowed' }] },
      { code: 'try { f() } catch (e) { console.error(e); console.log(e); }', errors: [{ messageId: 'swallowed' }] },
      { code: 'try { f() } catch (e) { console.warn("failed", e); }', errors: [{ messageId: 'swallowed' }] },
    ],
  });
});
