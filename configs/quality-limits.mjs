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

export default {
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'],
  rules: {
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4],
    'max-params': ['error', 3],
    complexity: ['error', 10],
  },
};
