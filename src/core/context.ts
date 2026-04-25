/**
 * Immutable parse state — a pointer (`position`) into an input `buffer`.
 *
 * Ports `lib/src/core/context.dart` from upstream Dart PetitParser. Kept as a
 * plain interface (not a class) so it allocates as a literal object and so
 * `Result<R>` can share the same shape without a base class.
 */
export interface Context {
  readonly buffer: string;
  readonly position: number;
}

export function context(buffer: string, position = 0): Context {
  return { buffer, position };
}
