// Disallow Math.random() for values named like secrets/tokens — it is NOT
// cryptographically secure. AI reaches for Math.random() when it needs "some random
// string" for tokens/keys, but those must come from a CSPRNG.
// Use node:crypto.randomBytes() (Node) or crypto.getRandomValues() (browser).

// Match common secret-ish identifiers. "key" alone is intentionally excluded — too
// many false positives (monkey, keyboard). "apikey"/"api_key"/"api-key" all match.
const SENSITIVE = /secret|token|password|passwd|pwd|salt|nonce|credential|api[-_]?key|auth(?:orization)?/i;

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow Math.random() for secrets/tokens — use a CSPRNG.' },
    schema: [],
    messages: {
      weakRandom:
        '`Math.random()` is not cryptographically secure. Use `crypto.getRandomValues()` (browser) or `node:crypto.randomBytes()` (Node) for `{{name}}`.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isMathRandom(node.callee)) return;
        const target = assignmentTarget(node);
        const name = target && targetName(target);
        if (name && SENSITIVE.test(name)) {
          context.report({ node, messageId: 'weakRandom', data: { name } });
        }
      },
    };
  },
};

const isMathRandom = (c) =>
  c?.type === 'MemberExpression' &&
  !c.computed &&
  c.object?.type === 'Identifier' && c.object.name === 'Math' &&
  c.property?.type === 'Identifier' && c.property.name === 'random';

// The identifier being initialized/assigned the Math.random() result, if any.
function assignmentTarget(call) {
  const p = call.parent;
  if (p.type === 'VariableDeclarator' && p.init === call) return p.id;
  if (p.type === 'AssignmentExpression' && p.right === call) return p.left;
  if (p.type === 'Property' && !p.computed && p.value === call) return p.key;
  return null;
}

function targetName(node) {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && node.property?.type === 'Identifier') return node.property.name;
  return null;
}
