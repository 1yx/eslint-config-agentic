// Rule unit tests, driven by ESLint's RuleTester over node:test (zero extra deps).
//
//   pnpm test    # or: node --test tests/

import test from 'node:test';
import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';

import noEmptyCatch from '../rules/no-empty-catch.mjs';
import noAsyncArrayCallback from '../rules/no-async-array-callback.mjs';
import noBroadException from '../rules/no-broad-exception.mjs';
import noHardcodedSecret from '../rules/no-hardcoded-secret.mjs';
import globalLiteralConstNaming from '../rules/global-literal-const-naming.mjs';

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
