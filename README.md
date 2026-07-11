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

## Options

`agentic()` accepts an options object:

| Option | Default | Purpose |
|--------|---------|---------|
| `tsconfigRootDir` | `process.cwd()` | Directory containing `tsconfig.json` for type-aware rules. |
| `allowAsAssertions` | `false` | Permit `as` assertions at framework type boundaries (`JSON.parse`, `Response.json`, drizzle `.set()`/`sql`, …). `as const` is always allowed; `!` stays banned. See [Escape hatches & framework boundaries](#escape-hatches--framework-boundaries). |

```js
export default agentic({ allowAsAssertions: true });
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

## Monorepo

Path globs use a `**/` prefix (e.g. `**/src/**`, `**/tests/**`), so the config works identically in a **single-package repo** (`src/foo.ts`) and a **monorepo** (`packages/foo/src/bar.ts`) from one root config. Type-aware rules resolve each file's nearest `tsconfig.json`, so per-package tsconfigs work out of the box.

## What it enforces

- **Quality limits** (all errors): ≤50 lines/function (logic), ≤500 lines/file, ≤4 nesting levels, ≤3 params, cyclomatic complexity ≤10. **React (`.tsx`/`.jsx`) is exempt from `max-lines-per-function`** — JSX inflates line count without inflating complexity; `complexity` and file-length remain as backstops.
- **Core style**: no `var`, prefer `const`, strict equality (`==null` allowed), braces on all branches, template literals, shorthand, no duplicate imports, `no-eval`.
- **TypeScript**: unused vars (`_` prefix ignored), type-only imports, `type` over `interface`, no `require()`, warn on `any`/unsafe-assignment/unsafe-return.
- **Async / Promise safety** (errors): no floating promises, no misused promises, no awaiting non-thenables; warn on async-without-await.
- **Temporal-only dates**: `new Date()`, `Date.now()`, `Date.parse()` are banned in `src/`, `tests/`, `scripts/` — use the Temporal API (**runtime**: shipped natively in Node 26+, Chrome 144, Firefox 139; **types**: see [Requirements](#requirements) — TypeScript does not yet ship Temporal types).
- **No escape hatches in `src/`**: non-null assertions (`!`) are always banned; type assertions (`as`) are banned **except `as const`** (which only narrows, never widens). Pass `allowAsAssertions: true` to permit `as` at framework boundaries where the framework's types are genuinely `unknown`. JSDoc/TSDoc required on declarations.
- **Naming conventions**: kebab-case filenames for `.ts`/`.js`; `.tsx`/`.jsx` follow the directory (`app/` → kebab, `components/` → PascalCase); camelCase variables/functions, PascalCase types, UPPER_SNAKE_CASE for global const literals.
- **React-friendly**: `.tsx`/`.jsx` files are fully linted (not ignored); both Node and browser globals are available.
- **Inlined agent guardrails**: empty catch blocks, `array.map(async ...)`, `catch (e: any)`, hardcoded secrets.

## Escape hatches & framework boundaries

In `src/`, the config bans TypeScript escape hatches because AI reaches for them to silence type errors:

- **`!` (non-null assertion)** — always banned. Almost always a real null-handling bug.
- **`as` (type assertion)** — banned **except `as const`**. `as const` only narrows a value (it can never widen its type), so it is never an escape hatch.

Some frameworks genuinely need `as` because their types are `unknown` and the type system can't express the real shape:

```ts
const data = JSON.parse(raw) as MyShape;              // JSON.parse returns unknown
const body = (await res.json()) as ApiResult;        // Response.json returns Promise<any>
races.set(values as Partial<typeof races.$inferInsert>); // drizzle dynamic .set()
const q = sql`...` as SQL<unknown>;                   // drizzle sql tag
```

If your project uses these, opt in once:

```js
export default agentic({ allowAsAssertions: true });
```

This lifts the `as` ban (keeping `!` and the `Date` ban). `as` should still be avoided by convention — use type guards, `zod`, or correct inference wherever a clean form exists; reserve `as` for the boundary cases above.

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
| Filenames: `.ts`/`.js` → kebab; `.tsx`/`.jsx` → kebab in `app/`, PascalCase in `components/` | `check-file/filename-naming-convention` |
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

### Temporal types (TypeScript prerequisite)

> TypeScript does **not** ship `Temporal` types. The Temporal rule forces `Temporal.*` usage, but `tsc` will report `Cannot find name 'Temporal'` (TS2304) until you supply the global type yourself. This is a hard prerequisite for the Temporal rule, not optional.

Runtime: Node 26+ provides `Temporal` globally — no import, no polyfill. Types: install `@js-temporal/polyfill` **as a dev dependency** and bridge it to the global with one ambient declaration file (the polyfill is used for **types only** — `import type` is erased at build time, so it adds **zero runtime/bundle cost** and does not shadow the native `Temporal`):

```bash
pnpm add -D @js-temporal/polyfill
```

```ts
// src/types/temporal.d.ts — makes the global Temporal visible to tsc.
// At runtime the native Node 26 Temporal is used; this only teaches TypeScript its shape.
import type { Temporal as TemporalType } from '@js-temporal/polyfill';

declare global {
  const Temporal: typeof TemporalType;
}
```

To annotate values with Temporal types elsewhere, import the type directly:

```ts
import type { Temporal as TemporalType } from '@js-temporal/polyfill';

interface Event { startTime: TemporalType.ZonedDateTime }
```

When TypeScript eventually ships native Temporal types, delete `temporal.d.ts` and drop the dev dependency — no source changes needed.

## License

MIT
