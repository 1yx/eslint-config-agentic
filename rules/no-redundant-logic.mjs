// Catch redundant boolean logic AI frequently emits: `x === true`, `x === false`,
// `x !== true`, and ternaries that just re-wrap a boolean (`x ? true : false`).
// They compile fine but signal the model didn't trust its own condition.

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Disallow redundant boolean logic (`x === true`, `x ? true : false`).' },
    schema: [],
    messages: {
      boolCompare: 'Redundant comparison to a boolean literal — use the value directly (or `!x`).',
      boolTernary: 'Redundant ternary returning booleans — use the condition directly (or `!x`).',
    },
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== '===' && node.operator !== '!==') return;
        const l = isBool(node.left);
        const r = isBool(node.right);
        if (l === r) return; // both literals or both real expressions
        context.report({ node, messageId: 'boolCompare' });
      },
      ConditionalExpression(node) {
        if (isBool(node.consequent) && isBool(node.alternate)) {
          context.report({ node, messageId: 'boolTernary' });
        }
      },
    };
  },
};

const isBool = (n) => n.type === 'Literal' && (n.value === true || n.value === false);
