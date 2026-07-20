// Adapted from eslint-plugin-ai-guard (MIT, (c) YashJadhav21).
//
// Type-aware: a `catch (e: unknown)` block also counts as narrowed when it calls a
// custom type guard — a function whose declared return type is a type predicate
// (`e is T`) — on the catch param. This recognizes patterns like
// `if (isNodeError(e) && e.code === 'ENOENT')` that `instanceof` can't express.
// Falls back to instanceof-only when type info is unavailable (no `project`).

import ts from 'typescript';

// instanceof narrowing — pure AST, always available.
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

// Type-aware: any call in the subtree whose signature returns a type predicate AND
// passes paramName as an argument. Requires parserServices from @typescript-eslint.
function containsTypeGuardCall(node, services, checker, paramName) {
  if (!node || typeof node !== 'object') return false;
  if (
    node.type === 'CallExpression' &&
    node.arguments.some((a) => a.type === 'Identifier' && a.name === paramName)
  ) {
    const tsCall = services.esTreeNodeToTSNodeMap.get(node);
    const sig = tsCall && checker.getResolvedSignature(tsCall);
    const decl = sig && sig.getDeclaration();
    if (decl && decl.type && ts.isTypePredicateNode(decl.type)) return true;
  }
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && item.type && containsTypeGuardCall(item, services, checker, paramName)) return true;
      }
    } else if (child && typeof child === 'object' && child.type) {
      if (containsTypeGuardCall(child, services, checker, paramName)) return true;
    }
  }
  return false;
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow overly broad catch types (`catch (e: any)` or un-narrowed `catch (e: unknown)`). Recognizes `instanceof` and custom type guards (`e is T`).',
    },
    schema: [],
    messages: {
      broadException:
        'Catch parameter has an overly broad type annotation `{{type}}`. Narrow it: use a specific error type, an `instanceof` check, or a custom type guard (`e is T`) inside the catch block.',
    },
  },
  create(context) {
    const services = context.sourceCode?.parserServices;
    const typeAware = !!services?.program;
    const checker = typeAware ? services.program.getTypeChecker() : null;

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
          const hasInstanceof = node.body.body.some((stmt) => containsInstanceofCheck(stmt, param.name));
          const hasGuard = typeAware && containsTypeGuardCall(node.body, services, checker, param.name);
          if (!hasInstanceof && !hasGuard) {
            context.report({ node: param, messageId: 'broadException', data: { type: 'unknown' } });
          }
        }
      },
    };
  },
};
