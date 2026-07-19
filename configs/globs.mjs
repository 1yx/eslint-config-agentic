// Shared glob fragments. tsx/jsx are intentionally absent — the config is framework-
// neutral. React/Vue templates and consumers opt them back in via each block's `files`.
//
// All blocks default to `allCode` so they line up when composed; override per-block or
// via `files` on the agentic() preset to add framework extensions.

export const EXT = '*.{js,mjs,cjs,ts,mts,cts}';
export const allCode = `**/${EXT}`;
export const sourceDefault = `**/src/**/${EXT}`;
export const testsGlob = `**/tests/**/${EXT}`;
export const scriptsDefault = [`**/scripts/**/${EXT}`, `**/src/scripts/**/${EXT}`];
export const jsOnly = '**/*.{js,mjs,cjs}';
