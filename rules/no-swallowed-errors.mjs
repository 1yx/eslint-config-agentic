// Disallow catch blocks that only log to console and swallow the error — the program
// continues as if nothing failed. Complements no-empty-catch (which handles totally
// empty blocks).
//
// Narrow by design: a block triggers only when EVERY non-empty statement is a bare
// `console.<method>(...)` call. Real handling (rethrow, return error, delegate to a
// logger/handler) does not trigger — so false positives stay low.

const CONSOLE_METHODS = new Set(['log', 'warn', 'error', 'debug', 'info']);

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow catch blocks that only console-log and swallow the error.' },
    schema: [],
    messages: {
      swallowed:
        'Catch block only logs the error — it is silently swallowed. Rethrow, return an error result, or delegate to an error handler.',
    },
  },
  create(context) {
    return {
      CatchClause(node) {
        const stmts = node.body.body.filter((s) => s.type !== 'EmptyStatement');
        if (stmts.length === 0) return; // empty → no-empty-catch handles it
        if (stmts.every(isConsoleOnlyCall)) {
          context.report({ node: node.body, messageId: 'swallowed' });
        }
      },
    };
  },
};

function isConsoleOnlyCall(stmt) {
  if (stmt.type !== 'ExpressionStatement') return false;
  const expr = stmt.expression;
  if (expr.type !== 'CallExpression') return false;
  const callee = expr.callee;
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.object.type === 'Identifier' && callee.object.name === 'console' &&
    callee.property.type === 'Identifier' && CONSOLE_METHODS.has(callee.property.name)
  );
}
