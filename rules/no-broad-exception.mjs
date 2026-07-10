// Adapted from eslint-plugin-ai-guard (MIT, (c) YashJadhav21).

function containsInstanceofCheck(node, paramName) {
  if (!node || typeof node !== 'object') return false;
  if (
    node.type === 'BinaryExpression' && node.operator === 'instanceof' &&
    node.left && node.left.type === 'Identifier' && node.left.name === paramName
  ) {
    return true;
  }
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) if (containsInstanceofCheck(item, paramName)) return true;
    } else if (child && typeof child === 'object' && child.type) {
      if (containsInstanceofCheck(child, paramName)) return true;
    }
  }
  return false;
}

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow overly broad catch clause types (`catch (e: any)` or un-narrowed `catch (e: unknown)`).' },
    schema: [],
    messages: {
      broadException:
        'Catch parameter has an overly broad type annotation `{{type}}`. AI tools frequently generate `catch (e: any)` which hides the real error type. Use a specific error type or narrow with `instanceof` checks inside the catch block.',
    },
  },
  create(context) {
    return {
      CatchClause(node) {
        const { param } = node;
        if (!param) return;
        if (param.type !== 'Identifier' || !param.typeAnnotation || !param.typeAnnotation.typeAnnotation) {
          return;
        }
        const typeNode = param.typeAnnotation.typeAnnotation;
        if (typeNode.type === 'TSAnyKeyword') {
          context.report({ node: param, messageId: 'broadException', data: { type: 'any' } });
          return;
        }
        if (typeNode.type === 'TSUnknownKeyword') {
          const hasNarrowing = node.body.body.some((stmt) => containsInstanceofCheck(stmt, param.name));
          if (!hasNarrowing) {
            context.report({ node: param, messageId: 'broadException', data: { type: 'unknown' } });
          }
        }
      },
    };
  },
};
