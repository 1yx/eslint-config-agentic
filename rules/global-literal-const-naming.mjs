// Enforce UPPER_SNAKE_CASE for global const declarations with literal initializers.
// Only catches simple literals (strings, numbers, booleans, template literals without
// expressions, unary on a literal) — Zod schemas, object instances, etc. are exempt.

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Enforce UPPER_SNAKE_CASE for global const with literal values.' },
    schema: [],
    messages: {
      upperSnake:
        'Global const with a literal value should use UPPER_SNAKE_CASE. Rename `{{name}}` to `{{suggested}}`.',
    },
  },
  create(context) {
    return {
      VariableDeclaration(node) {
        if (node.kind !== 'const') return;
        // Top-level const — directly under Program, or wrapped by an export declaration.
        const isTopLevel =
          node.parent.type === 'Program' ||
          (node.parent.type === 'ExportNamedDeclaration' && node.parent.declaration === node);
        if (!isTopLevel) return;
        for (const decl of node.declarations) {
          if (decl.id.type !== 'Identifier' || !decl.init) continue;
          const { init } = decl;
          const isLiteral =
            init.type === 'Literal' ||
            (init.type === 'TemplateLiteral' && init.expressions.length === 0) ||
            (init.type === 'UnaryExpression' && init.argument.type === 'Literal');
          if (!isLiteral) continue;
          const { name } = decl.id;
          if (/^[A-Z][A-Z0-9_]*$/.test(name)) continue;
          context.report({
            node: decl.id,
            messageId: 'upperSnake',
            data: { name, suggested: name.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase() },
          });
        }
      },
    };
  },
};
