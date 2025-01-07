export function assert(bool, invariant) {
  if (!bool) {
    debugger;
    throw invariant;
  }
}
