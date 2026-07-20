# eslint-config-agentic

Composable ESLint flat config for AI-generated TypeScript. **Framework-neutral by default** — no React/Vue/Svelte baked in. Type safety, Promise safety, Temporal-only dates, and inlined agent guardrails, exposed as independent blocks you compose — plus a one-call preset.

Derived from a production agent codebase. Opinions are strong on purpose.

## Install

```bash
pnpm add -D eslint-config-agentic eslint typescript
```

## Use

Two ways. **Preset** (everything on, one call) or **compose** (pick blocks).

### Preset

```js
// eslint.config.mjs
import agentic from 'eslint-config-agentic';
export default agentic();
```

### Compose

Each concern is an independently-imported block. `base()` provides the parser and plugin registry — include it **first**, then add what you want:

```js
import { base, coreStyle, tsStrictness, promiseSafety, agentGuardrails, temporal } from 'eslint-config-agentic';

export default [
  ...base(),
  ...coreStyle(),
  tsStrictness(),
  promiseSafety(),
  agentGuardrails(),
  temporal(),
  // skip naming/jsdoc/escapeHatches/qualityLimits/scriptsRelax if you don't want them
];
```

`agentic()` is exactly the composition of all fourteen blocks — use it when you want everything.

## Blocks

| Block | Enforces | Default scope |
|-------|----------|---------------|
| `base()` | parser, plugins, ignores, globals | all code |
| `coreStyle()` | `no-var`, `prefer-const`, `eqeqeq`, `curly`, templates, unreachable | all code |
| `naming()` | `naming-convention` + global-literal-const UPPER_SNAKE | all code |
| `checkFile()` | filename naming (kebab for `src`/`test`/`tests`/`scripts`) | all code |
| `tsStrictness()` | type-only imports, `type` over `interface`, `no-explicit-any`, `unsafe-*`, `only-throw-error`, `prefer-nullish-coalescing` | all code |
| `tsdoc()` | `tsdoc/syntax` | all code |
| `promiseSafety()` | floating/misused promises, await-thenable, no async promise executor | all code |
| `agentGuardrails()` | empty/swallowed catch, async array callbacks, broad exceptions, secrets, weak randomness, redundant logic, LLM artifacts, `eval` | all code |
| `qualityLimits()` | ≤50 lines/function, ≤500 lines/file, ≤4 depth, ≤3 params, complexity ≤10 | all code |
| `temporal()` | ban `Date.*` — Temporal only | source + tests + scripts |
| `escapeHatches()` | ban `as` (except `as const`; boundary call patterns allowlistable via `allowAsAssertions`) and `!` | source |
| `jsdoc()` | require JSDoc on declarations | source |
| `scriptsRelax()` | turn off limits + JSDoc for scripts | scripts |
| `eslintConfigExclude()` | exclude `eslint.config.*` from type-aware | config file |

**"All code" defaults to `**/*.{js,mjs,cjs,ts,mts,cts}` — no `tsx`/`jsx`.** Add them via the `files` option (per-block, or on the preset).

## Preset options

`agentic(options)` threads options to the relevant blocks:

| Option | Default | Purpose |
|--------|---------|---------|
| `tsconfigRootDir` | `process.cwd()` | Dir with `tsconfig.json` for type-aware rules. |
| `files` | all code (no tsx/jsx) | Override the all-code glob — add `tsx`/`jsx`/`vue` for frameworks. |
| `sourceFiles` | `src/` | Source globs for `temporal`, `escapeHatches`, `jsdoc`. |
| `scriptFiles` | `scripts/` + `src/scripts/` | Script globs for `scriptsRelax` + `temporal`. |
| `filenameConventions` | `{}` | Extra `glob → convention` entries merged into `checkFile` defaults (your keys win). |
| `maxLinesPerFunction` | `{}` | Per-glob overrides for `max-lines-per-function`: `{ glob: false \| number }`. `false` disables; a number caps. |
| `allowAsAssertions` | `false` | `false` bans all `as` (except `as const`). `true` permits all. A string array (e.g. `['JSON.parse', 'Response.json']`) permits `as` only on those left-hand call patterns — recommended for framework boundaries. `!` always banned. |

```js
export default agentic({
  files: ['**/*.{ts,tsx}'],          // lint tsx too
  sourceFiles: ['**/src/**/*.{ts,tsx}'],
  maxLinesPerFunction: { '**/*.{tsx,jsx}': false },
});
```

## Templates

Ready-made starting points in [`templates/`](./templates) — copy one as your `eslint.config.mjs`:

- **`templates/basic.mjs`** — plain TypeScript (Node CLI, library). The preset, zero config.
- **`templates/react.mjs`** — React/Next.js. Adds `tsx`/`jsx` back to scope, restores `app/`→kebab + `components/`→PascalCase filename rules, relaxes `max-lines-per-function` for JSX.
- **`templates/vue.mjs`** — Vue 3. Layers `vue-eslint-parser` (outer) + `@typescript-eslint/parser` (for `<script>`) and `eslint-plugin-vue` recommended. Needs `pnpm add -D eslint-plugin-vue vue-eslint-parser`.

## Composing with framework plugins

This config does **not** bundle framework parsers/plugins — add the one you need. The Vue template shows the full pattern; the key points:

- `.vue`/`.svelte` need their own parser block (outer framework parser + nested `@typescript-eslint/parser` for `<script>`).
- **Framework-boundary rules extend automatically** when you add the glob to `files`, `sourceFiles`, `maxLinesPerFunction`, or `filenameConventions` — those blocks match whatever glob you give them.
- **Core TS/style rules also cover framework files** once they're in `files` (since 0.2.0 — `base()` registers the `@typescript-eslint` plugin globally, and rule blocks match your `files` glob). For rules specific to the framework (e.g. Vue template rules), add the plugin's recommended config.

## Nested repos & dot-directories

ESLint's `**` glob does not traverse dot-directories. If your repo contains a nested checkout ESLint shouldn't lint — a git worktree (`.worktree/`), a vendored copy, a sibling repo — add it to `ignores`. Otherwise ESLint may walk those files while the plugin-registering block's `files` glob doesn't match them, surfacing as `plugin not found` errors:

```js
import agentic from 'eslint-config-agentic';

export default [
  ...agentic(),
  { ignores: ['.worktree/**'] },
];
```

## Escape hatches & framework boundaries

In source, the config bans TypeScript escape hatches because AI reaches for them to silence type errors:

- **`!` (non-null assertion)** — always banned. Almost always a real null-handling bug.
- **`as` (type assertion)** — banned **except `as const`**. `as const` only narrows, never widens. Double assertions (`x as unknown as T`) are banned outright with a dedicated message — they deliberately punch through the type system and are never a framework boundary.

Some frameworks genuinely need `as` at their type boundary (`JSON.parse`, `Response.json`, drizzle `.set()`/`sql` return `unknown`). `allowAsAssertions` has three forms:

- **`false`** (default) — ban all `as` (except `as const`). For an occasional boundary, prefer a line-level disable over weakening the rule:
  ```ts
  // eslint-disable-next-line no-restricted-syntax
  const d = JSON.parse(raw) as MyShape;
  ```
- **`['JSON.parse', 'Response.json', …]`** — permit `as` only when the left-hand side is one of these call patterns. **Recommended** when a project has several framework boundaries; the rest of `as` stays banned.
  ```js
  export default agentic({ allowAsAssertions: ['JSON.parse', 'Response.json'] });
  ```
- **`true`** — permit all `as`. Only for projects that use `as` pervasively (heavy drizzle/fetch); effectively gives up the rule.

`!` is always banned regardless.

## Inlined agent guardrails

`agentGuardrails()` ships eight custom rules (in `rules/`) catching AI-specific bugs that typescript-eslint can't detect structurally:

| Rule | Severity | Catches |
|---|---|---|
| `agentic/no-empty-catch` | error | `catch (e) {}` — silently swallows errors |
| `agentic/no-swallowed-errors` | warn | `catch (e) { console.log(e) }` — logs but continues as if nothing failed |
| `agentic/no-async-array-callback` | warn | `array.map(async ...)` — returns `Promise[]`, not values |
| `agentic/no-broad-exception` | warn | `catch (e: any)` / un-narrowed `catch (e: unknown)` |
| `agentic/no-hardcoded-secret` | error | `apiKey`, `password`, `token` literals in source |
| `agentic/no-weak-randomness-for-secrets` | error | `Math.random()` for tokens/keys (not a CSPRNG) |
| `agentic/no-redundant-logic` | warn | `x === true`, `x ? true : false` |
| `agentic/no-llm-artifacts` | warn | `// Generated by Claude` attribution comments |

Plus ESLint's `no-eval`. `no-async-array-callback` is aware of the legitimate `await Promise.all(arr.map(async ...))` pattern (direct wrap or assign-then-consume) and does **not** flag it.

## Requirements

| Peer | Version |
|------|---------|
| eslint | `^9.0.0 \|\| ^10.0.0` |
| typescript | `^5.0.0` |

Requires **Node.js ≥ 26** — the Temporal API ships natively only from Node 26. All plugins are bundled as `dependencies`, so installing this one package is enough.

### Temporal types (TypeScript prerequisite)

TypeScript does **not** ship `Temporal` types. The `temporal()` rule forces `Temporal.*` usage, but `tsc` reports `Cannot find name 'Temporal'` (TS2304) until you supply the global type. Install the polyfill as a dev dependency and bridge it to the global (types only — zero runtime cost):

```bash
pnpm add -D @js-temporal/polyfill
```

```ts
// src/types/temporal.d.ts
import type { Temporal as TemporalType } from '@js-temporal/polyfill';
declare global {
  const Temporal: typeof TemporalType;
}
```

When TypeScript ships native Temporal types, delete `temporal.d.ts` and drop the dev dependency.

## License

MIT
