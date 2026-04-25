/**
 * Lisp value AST. A discriminated union mirroring the seven kinds of value
 * the parser and evaluator can produce.
 *
 * `nil` is a singleton — there's only one empty list. `boolean` is separate
 * from `nil` (we follow Scheme: `#f` is the only false value, everything
 * else including `nil` and `0` is truthy at the `if` level — but `null?`
 * specifically tests for `nil`).
 *
 * `function` wraps a host callable so user-defined and built-in operators
 * share the same `apply` machinery in the evaluator.
 */
export type LispValue =
  | { readonly kind: 'symbol'; readonly name: string }
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'string'; readonly value: string }
  | { readonly kind: 'boolean'; readonly value: boolean }
  | { readonly kind: 'nil' }
  | { readonly kind: 'list'; readonly items: readonly LispValue[] }
  | {
      readonly kind: 'function';
      readonly name: string;
      readonly apply: (args: readonly LispValue[], env: Env) => LispValue;
    };

/** Lexical environment — a chained scope of bindings. */
export class Env {
  readonly bindings: Map<string, LispValue>;
  readonly parent: Env | null;

  constructor(parent: Env | null = null, initial: Iterable<readonly [string, LispValue]> = []) {
    this.parent = parent;
    this.bindings = new Map(initial);
  }

  /** Walk up the scope chain to find `name`, returning `undefined` if unbound. */
  lookup(name: string): LispValue | undefined {
    if (this.bindings.has(name)) return this.bindings.get(name);
    return this.parent ? this.parent.lookup(name) : undefined;
  }

  /** Bind a value in the current scope (shadowing any outer binding). */
  define(name: string, value: LispValue): void {
    this.bindings.set(name, value);
  }
}

export const NIL: LispValue = { kind: 'nil' };
export const TRUE: LispValue = { kind: 'boolean', value: true };
export const FALSE: LispValue = { kind: 'boolean', value: false };

/** Convenience constructor — `sym('foo')` is `{ kind: 'symbol', name: 'foo' }`. */
export function sym(name: string): LispValue {
  return { kind: 'symbol', name };
}

/** Convenience constructor — `num(42)` is `{ kind: 'number', value: 42 }`. */
export function num(value: number): LispValue {
  return { kind: 'number', value };
}

/** Convenience constructor — `list(a, b, c)` is `{ kind: 'list', items: [a,b,c] }`. */
export function list(...items: LispValue[]): LispValue {
  return { kind: 'list', items };
}

/** Pretty-print a value for REPL/test output. */
export function show(value: LispValue): string {
  switch (value.kind) {
    case 'nil':
      return '()';
    case 'boolean':
      return value.value ? '#t' : '#f';
    case 'number':
      return String(value.value);
    case 'string':
      return JSON.stringify(value.value);
    case 'symbol':
      return value.name;
    case 'list':
      return '(' + value.items.map(show).join(' ') + ')';
    case 'function':
      return `#<function:${value.name}>`;
  }
}
