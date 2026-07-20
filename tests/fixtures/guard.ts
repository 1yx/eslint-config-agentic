// Custom type guard (`e is Error`) narrows the catch param — must NOT be flagged.
declare function f(): void;
function isErr(e: unknown): e is Error {
  return e instanceof Error;
}
try {
  f();
} catch (e: unknown) {
  if (isErr(e)) console.log(e);
}
