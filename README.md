# eslint-config-agentic

Shareable ESLint **flat config** tuned for AI-generated TypeScript. One package gives you: type safety, Promise safety, **Temporal-only dates**, and **inlined agent semantic guardrails** — all in a single pass.

Derived from a production agent codebase. Opinions are strong on purpose.

## Install

```bash
pnpm add -D eslint-config-agentic eslint typescript
```

## Use

Create `eslint.config.mjs` in your project root:

```js
import agentic from 'eslint-config-agentic';

export default agentic();
```

Run ESLint:

```bash
pnpm eslint .
```

The config assumes eslint runs from your repo root (so `process.cwd()` is the project root, which `@typescript-eslint` needs to locate `tsconfig.json`). Override if not:

```js
export default agentic({ tsconfigRootDir: import.meta.dirname });
```

## Extend / override

`agentic()` returns a plain flat-config array — spread it and append your own blocks:

```js
import agentic from 'eslint-config-agentic';

export default [
  ...agentic(),
  {
    rules: { 'no-console': 'error' },
  },
];
```

## What it enforces

- **Quality limits** (all errors): ≤50 lines/function, ≤500 lines/file, ≤4 nesting levels, ≤3 params, cyclomatic complexity ≤10.
- **Core style**: no `var`, prefer `const`, strict equality (`==null` allowed), braces on all branches, template literals, shorthand, no duplicate imports, `no-eval`.
- **TypeScript**: unused vars (`_` prefix ignored), type-only imports, `type` over `interface`, no `require()`, warn on `any`/unsafe-assignment/unsafe-return.
- **Async / Promise safety** (errors): no floating promises, no misused promises, no awaiting non-thenables; warn on async-without-await.
- **Temporal-only dates**: `new Date()`, `Date.now()`, `Date.parse()` are banned in `src/`, `tests/`, `scripts/` — use the Temporal API (shipped natively in Node 26+, Chrome 144, Firefox 139).
- **No escape hatches in `src/`**: type assertions (`as`) and non-null assertions (`!`) are banned; JSDoc/TSDoc required on declarations.
- **Naming conventions**: kebab-case filenames, camelCase variables/functions, PascalCase types, UPPER_SNAKE_CASE for global const literals.
- **Inlined agent guardrails**: empty catch blocks, `array.map(async ...)`, `catch (e: any)`, hardcoded secrets.

## Inlined agent guardrails

Four custom rules ship inside this package (in `rules.mjs`), catching AI-specific bugs that **typescript-eslint cannot detect structurally**:

| Rule | Severity | Catches |
|---|---|---|
| `agentic/no-empty-catch` | error | `catch (e) {}` — silently swallows errors |
| `agentic/no-async-array-callback` | warn | `array.map(async ...)` — returns `Promise[]`, not values |
| `agentic/no-broad-exception` | warn | `catch (e: any)` / un-narrowed `catch (e: unknown)` |
| `agentic/no-hardcoded-secret` | error | `apiKey`, `password`, `token` literals committed to source |

Plus ESLint's built-in `no-eval` (error) for `eval()` / `new Function()`.

`no-async-array-callback` is aware of the legitimate pattern — `await Promise.all(arr.map(async ...))` (direct wrap, or assign-then-consume) is **not** flagged.

**Why inlined, not a dependency?** The detection logic is compact, and these four are the rules that apply across *all* TypeScript projects. Logic adapted from [`eslint-plugin-ai-guard`](https://github.com/YashJadhav21/eslint-plugin-ai-guard) (MIT, (c) YashJadhav21) — narrowed to drop SQL/auth/HTTP-handler rules that only matter for web backends. No autofixes; the rules report and the agent acts on the message.

## Naming conventions

| Convention | Rule |
|---|---|
| Filenames: `kebab-case` in `src/`, `test(s)/`, `scripts/` | `check-file/filename-naming-convention` |
| Variables/functions/params: `camelCase` (`_` prefix allowed) | `@typescript-eslint/naming-convention` |
| Types/classes/interfaces/enums: `PascalCase` | `@typescript-eslint/naming-convention` |
| Global const with a literal value: `UPPER_SNAKE_CASE` | `agentic/global-literal-const-naming` (inlined) |
| Properties: unconstrained (HTTP headers, i18n keys, API fields) | `@typescript-eslint/naming-convention` |

`global-literal-const-naming` is an inlined custom rule (in `src/rules/`); the others come from `@typescript-eslint` and `eslint-plugin-check-file`.

## Requirements

| Peer | Version |
|------|---------|
| eslint | `^9.0.0 \|\| ^10.0.0` |
| typescript | `^5.0.0` |

Requires **Node.js ≥ 26** — the Temporal API ships natively only from Node 26 (older Node needs `--js-temporal` on 24, or `@js-temporal/polyfill` on ≤22). All plugins are bundled as `dependencies`, so installing this one package is enough.

## License

MIT
