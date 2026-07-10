// Adapted from eslint-plugin-ai-guard (MIT, (c) YashJadhav21).

const SECRET_NAME_PATTERN =
  /(?:secret|password|passwd|api[_-]?key|auth[_-]?token|access[_-]?token|private[_-]?key|client[_-]?secret|jwt[_-]?secret|encryption[_-]?key|signing[_-]?key)/i;

const FALSE_POSITIVE_VALUES = new Set([
  'password', 'secret', 'token', 'key', 'api_key', 'apikey', '', 'undefined', 'null',
  'test', 'example', 'placeholder', 'changeme', 'your-api-key', 'your-secret',
  'YOUR_API_KEY', 'YOUR_SECRET', 'xxx', 'TODO',
]);

function getStringValue(node) {
  if (!node) return null;
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0 && node.quasis.length === 1) {
    return node.quasis[0].value.cooked ?? null;
  }
  return null;
}

function isProcessEnvAccess(node) {
  return (
    node && node.type === 'MemberExpression' &&
    node.object.type === 'MemberExpression' &&
    node.object.object.type === 'Identifier' && node.object.object.name === 'process' &&
    node.object.property.type === 'Identifier' && node.object.property.name === 'env'
  );
}

function toEnvVarName(name) {
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/[-\s]/g, '_').toUpperCase();
}

// Avoid flagging an ESLint rule's own `messages: { ... }` object literals.
function isRuleMetaMessagesProperty(node) {
  if (!node.parent || node.parent.type !== 'ObjectExpression') return false;
  const grandparent = node.parent.parent;
  if (!grandparent || grandparent.type !== 'Property') return false;
  return grandparent.key.type === 'Identifier' && grandparent.key.name === 'messages';
}

function isSecretViolation(name, valueNode) {
  if (!SECRET_NAME_PATTERN.test(name)) return false;
  const value = getStringValue(valueNode);
  if (value === null) return false;
  if (FALSE_POSITIVE_VALUES.has(value) || value.length < 8) return false;
  if (isProcessEnvAccess(valueNode)) return false;
  return true;
}

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow hardcoded secrets, API keys, passwords, and tokens in source code.' },
    schema: [],
    messages: {
      hardcodedSecret:
        'Possible hardcoded secret in variable `{{name}}`. AI tools frequently generate placeholder credentials that get committed to version control. Use environment variables (e.g., `process.env.{{envName}}`) instead.',
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (!node.init || !node.id || node.id.type !== 'Identifier') return;
        if (isSecretViolation(node.id.name, node.init)) {
          context.report({
            node: node.init,
            messageId: 'hardcodedSecret',
            data: { name: node.id.name, envName: toEnvVarName(node.id.name) },
          });
        }
      },
      AssignmentExpression(node) {
        if (node.left.type !== 'MemberExpression' || node.left.property.type !== 'Identifier') return;
        const propName = node.left.property.name;
        if (isSecretViolation(propName, node.right)) {
          context.report({
            node: node.right,
            messageId: 'hardcodedSecret',
            data: { name: propName, envName: toEnvVarName(propName) },
          });
        }
      },
      Property(node) {
        if (node.key.type !== 'Identifier') return;
        if (isRuleMetaMessagesProperty(node)) return;
        if (isSecretViolation(node.key.name, node.value)) {
          context.report({
            node: node.value,
            messageId: 'hardcodedSecret',
            data: { name: node.key.name, envName: toEnvVarName(node.key.name) },
          });
        }
      },
    };
  },
};
