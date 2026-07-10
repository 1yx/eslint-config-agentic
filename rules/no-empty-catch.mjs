// Adapted from eslint-plugin-ai-guard (MIT, (c) YashJadhav21).

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow empty catch blocks that silently swallow errors.' },
    schema: [],
    messages: {
      emptyCatch:
        'Catch block is empty. AI tools frequently generate empty catch blocks that silently swallow errors. Handle the error (log, rethrow, or recover), or add a comment explaining why it is intentionally empty.',
    },
  },
  create(context) {
    return {
      CatchClause(node) {
        if (node.body.body.length === 0) {
          // A comment inside means the developer left it empty on purpose.
          if (context.sourceCode.getCommentsInside(node.body).length > 0) return;
          context.report({ node, messageId: 'emptyCatch' });
        }
      },
    };
  },
};
