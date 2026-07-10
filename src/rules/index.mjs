// Inlined custom ESLint rules shipped with this config.
//
// Agent semantic guardrails (no-empty-catch, no-async-array-callback,
// no-broad-exception, no-hardcoded-secret) are adapted from eslint-plugin-ai-guard
// (MIT, (c) YashJadhav21). global-literal-const-naming is a naming-convention rule.

import noEmptyCatch from './no-empty-catch.mjs';
import noAsyncArrayCallback from './no-async-array-callback.mjs';
import noBroadException from './no-broad-exception.mjs';
import noHardcodedSecret from './no-hardcoded-secret.mjs';
import globalLiteralConstNaming from './global-literal-const-naming.mjs';

export default {
  meta: { name: 'eslint-config-agentic-rules', version: '0.1.0' },
  rules: {
    'no-empty-catch': noEmptyCatch,
    'no-async-array-callback': noAsyncArrayCallback,
    'no-broad-exception': noBroadException,
    'no-hardcoded-secret': noHardcodedSecret,
    'global-literal-const-naming': globalLiteralConstNaming,
  },
};
