// Plain boolean return — NOT a type guard — must still be flagged.
declare function f(): void;
function notGuard(e: unknown): boolean {
  return true;
}
try {
  f();
} catch (e: unknown) {
  if (notGuard(e)) console.log(e);
}
