// Inlined agent guardrails: empty catch, async array callbacks, broad exceptions,
// hardcoded secrets, eval. Catches AI-specific patterns typescript-eslint can't see
// structurally. Uses the `agentic` plugin registered by `base()`.

import { allCode } from './globs.mjs';

/** @param {{ files?: string[] }} [options] */
export default function agentGuardrails({ files } = {}) {
  return {
    files: files ?? [allCode],
    rules: {
      'agentic/no-empty-catch': 'error',
      'agentic/no-async-array-callback': 'warn',
      'agentic/no-broad-exception': 'warn',
      'agentic/no-hardcoded-secret': 'error',
      'no-eval': 'error',
    },
  };
}
