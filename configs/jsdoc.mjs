// Require JSDoc/TSDoc on source declarations (functions, classes, type aliases).
// Arrow functions are excluded — short callbacks are too noisy.

import { sourceDefault } from './globs.mjs';

/** @param {object} [options]
 * @param {string[]} [options.sourceFiles] - Globs treated as source (default src/). */
export default function jsdoc({ sourceFiles } = {}) {
  return {
    files: sourceFiles ?? [sourceDefault],
    rules: {
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: true,
            FunctionExpression: true,
            ArrowFunctionExpression: false,
            ClassDeclaration: true,
            MethodDefinition: true,
          },
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
          checkAllFunctionExpressions: false,
          publicOnly: false,
        },
      ],
    },
  };
}
