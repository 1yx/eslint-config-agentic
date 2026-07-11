// Aggressive maintainability thresholds — all errors. Code exceeding these must be
// refactored before merging, not deferred.
//
// | Rule                    | Limit | Rationale                                      |
// |-------------------------|-------|------------------------------------------------|
// | Function length (lines) | 50    | Beyond 50 lines, intent becomes hard to scan   |
// | File length (lines)     | 500   | Beyond 500 lines, consider splitting modules   |
// | Nesting depth (levels)  | 4     | Deep nesting exponentially hides control flow  |
// | Function parameters     | 3     | More than 3 → wrap in an options object        |
// | Cyclomatic complexity   | 10    | Beyond 10, test cases multiply combinatorially |
//
// React (.tsx/.jsx) components are exempt from max-lines-per-function: JSX markup
// inflates line count far faster than it inflates complexity, so the 50-line cap —
// designed for logic functions — produces false positives on legitimate components
// (data-fetching pages, tables, forms). Community consensus: JSX render functions
// routinely reach 120+ lines without being "complex" (eslint/eslint#12236 asked for a
// skipJSX option that ESLint never shipped). complexity (≤10) and max-lines per file
// (≤500) still bound React files — only the per-function length rule is relaxed.

const baseLimits = {
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'],
  rules: {
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4],
    'max-params': ['error', 3],
    complexity: ['error', 10],
  },
};

const reactLimits = {
  // JSX verbosity ≠ complexity. Keep complexity + file-length as backstops.
  files: ['**/*.{tsx,jsx}'],
  rules: {
    'max-lines-per-function': 'off',
  },
};

export default [baseLimits, reactLimits];
