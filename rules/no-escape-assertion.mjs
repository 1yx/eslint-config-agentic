// Ban `as` type assertions (except `as const`), with a configurable boundary allowlist.
//
// Why a custom rule, not no-restricted-syntax: a CSS-like selector can't express
// "JSON.parse(...) as T" structurally — esquery attribute selectors don't descend into
// child node properties (callee.object.name). Rule code matches the callee chain exactly,
// so `allow: ['JSON.parse', 'Response.json']` permits `as` only at those boundaries.

const SCHEMA = {
  type: 'object',
  properties: {
    allow: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
};

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Ban `as` assertions except `as const` and configured boundaries.' },
    schema: [SCHEMA],
    messages: {
      escapeAssertion:
        'Avoid `as` assertions: use a type guard, explicit annotation, or correct inference. `as const` is always allowed. For framework boundaries (JSON.parse, Response.json, drizzle .set()/sql) add the call pattern to the rule\'s `allow` option.',
      doubleAssertion:
        'Double assertion (`x as unknown as T`) deliberately bypasses the type system — far more dangerous than a single `as`, and never a framework boundary. Refactor so the type relationship is real.',
    },
  },
  create(context) {
    const { allow = [] } = context.options[0] ?? {};
    return {
      TSAsExpression(node) {
        // `as const` only narrows a value — never an escape hatch.
        if (node.typeAnnotation?.typeName?.name === 'const') return;
        // Inner half of a double assertion — the outer `as T` reports it; skip here.
        if (node.parent?.type === 'TSAsExpression' && node.parent.expression === node) return;
        if (matchesAllowedCallee(node.expression, allow)) return;
        // `x as unknown as T` — deliberately punches through the type system.
        if (node.expression.type === 'TSAsExpression') {
          context.report({ node, messageId: 'doubleAssertion' });
          return;
        }
        context.report({ node, messageId: 'escapeAssertion' });
      },
    };
  },
};

// True if `expr` is `<pattern>(...)` for some allowed dotted pattern.
function matchesAllowedCallee(expr, patterns) {
  if (patterns.length === 0) return false;
  if (expr.type === 'AwaitExpression') expr = expr.argument; // unwrap `(await f())`
  if (expr.type !== 'CallExpression') return false;
  return patterns.some((p) => calleeMatches(expr.callee, p));
}

// Match a callee node against a dotted pattern: "JSON.parse", "Response.json",
// or a bare "parseFoo". Matches the full chain exactly (window.JSON.parse ≠ JSON.parse).
function calleeMatches(callee, pattern) {
  const parts = pattern.split('.');
  let node = callee;
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (node.type === 'Identifier') {
      return i === 0 && node.name === part;
    }
    if (
      node.type === 'MemberExpression' &&
      !node.computed &&
      node.property.type === 'Identifier'
    ) {
      if (node.property.name !== part) return false;
      node = node.object;
      continue;
    }
    return false;
  }
  return false;
}
