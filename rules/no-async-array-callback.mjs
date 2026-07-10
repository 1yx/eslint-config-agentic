// Adapted from eslint-plugin-ai-guard (MIT, (c) YashJadhav21).

const PROMISE_COMBINATORS = new Set(['all', 'allSettled', 'race', 'any']);
const ARRAY_CALLBACK_METHODS = new Set([
  'map', 'filter', 'forEach', 'reduce', 'flatMap', 'find', 'findIndex', 'some', 'every',
]);
const METHODS_ALLOWING_PROMISE_COLLECTION = new Set(['map', 'flatMap']);

function isNode(value) {
  return typeof value === 'object' && value !== null && 'type' in value;
}

// Manual child traversal (skips `parent` to avoid cycles). Used to detect
// whether a Promise combinator consumes a given identifier downstream.
function getChildNodes(node) {
  const children = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent' || !value) continue;
    if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) children.push(item);
    } else if (isNode(value)) {
      children.push(value);
    }
  }
  return children;
}

function isPromiseCombinatorCall(node) {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Promise' &&
    node.callee.property.type === 'Identifier' &&
    PROMISE_COMBINATORS.has(node.callee.property.name)
  );
}

// Direct wrap, e.g. `await Promise.all(arr.map(async ...))` — legitimate.
function isWrappedInPromiseCombinator(node, context) {
  const ancestors = context.sourceCode.getAncestors(node);
  const { parent } = node;
  if (parent && parent.type === 'CallExpression' && isPromiseCombinatorCall(parent)) {
    return true;
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (ancestor.type === 'CallExpression') {
      if (isPromiseCombinatorCall(ancestor)) return true;
      break;
    }
  }
  return false;
}

function isIdentifierConsumedByPromiseCombinator(node, identifierName) {
  let found = false;
  const visit = (current) => {
    if (found) return;
    if (current.type === 'CallExpression' && isPromiseCombinatorCall(current)) {
      for (const arg of current.arguments) {
        if (arg.type === 'Identifier' && arg.name === identifierName) {
          found = true;
          return;
        }
      }
    }
    for (const child of getChildNodes(current)) {
      visit(child);
      if (found) return;
    }
  };
  visit(node);
  return found;
}

// Indirect consumption, e.g.
//   const xs = arr.map(async ...);
//   await Promise.all(xs);
function isAssignedAndConsumedByPromiseCombinator(node) {
  if (!node.parent || node.parent.type !== 'VariableDeclarator' || node.parent.id.type !== 'Identifier') {
    return false;
  }
  const variableName = node.parent.id.name;
  const declaration = node.parent.parent;
  if (!declaration || declaration.type !== 'VariableDeclaration') return false;
  const container = declaration.parent;
  if (!container || (container.type !== 'Program' && container.type !== 'BlockStatement')) {
    return false;
  }
  const declarationIndex = container.body.findIndex((s) => s === declaration);
  if (declarationIndex === -1) return false;
  for (let i = declarationIndex + 1; i < container.body.length; i++) {
    if (isIdentifierConsumedByPromiseCombinator(container.body[i], variableName)) return true;
  }
  return false;
}

function isAsyncCallback(node) {
  return (
    (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') &&
    node.async === true
  );
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow async callbacks in array iteration methods.' },
    schema: [],
    messages: {
      asyncArrayCallback:
        'Async callback passed to Array.{{method}}(). This returns an array of Promises, not resolved values. AI tools frequently generate this pattern. Wrap with `await Promise.all(array.{{method}}(...))` or use a for...of loop.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression' || node.callee.property.type !== 'Identifier') {
          return;
        }
        const methodName = node.callee.property.name;
        if (!ARRAY_CALLBACK_METHODS.has(methodName)) return;
        const callback = node.arguments[0];
        if (!callback || !isAsyncCallback(callback)) return;
        // Legitimate: wrapped in Promise.all/allSettled/race/any.
        if (isWrappedInPromiseCombinator(node, context)) return;
        // Legitimate: assigned then consumed by a Promise combinator.
        if (METHODS_ALLOWING_PROMISE_COLLECTION.has(methodName) && isAssignedAndConsumedByPromiseCombinator(node)) {
          return;
        }
        context.report({ node: callback, messageId: 'asyncArrayCallback', data: { method: methodName } });
      },
    };
  },
};
