// Template: React / Next.js project.
// Adds tsx/jsx back to every block's scope, restores the React filename conventions
// (app/ → kebab, components/ → PascalCase) and the JSX function-length relaxation.
//
// Requires: eslint-config-agentic (this package). No extra plugins — React files are
// parsed by the @typescript-eslint/parser already wired in base().

import agentic from 'eslint-config-agentic';

const CODE = '*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}';

export default agentic({
  files: [`**/${CODE}`],
  sourceFiles: [`**/src/**/${CODE}`],
  filenameConventions: {
    '**/app/**/*.{tsx,jsx}': 'KEBAB_CASE',
    '**/components/**/*.{tsx,jsx}': 'PASCAL_CASE',
  },
  // JSX inflates line count without inflating complexity — relax the cap on tsx/jsx.
  maxLinesPerFunction: { '**/*.{tsx,jsx}': false },
});
