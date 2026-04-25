import { Env, FALSE, NIL, TRUE, show, type LispValue } from './types.ts';

/**
 * Evaluate a single form. Special forms (`quote`, `if`, `define`, `lambda`,
 * `let`, `cond`, `begin`) get their own dispatch. Everything else is treated
 * as a function application: evaluate the head, then each argument, then
 * `apply` the head to the arg list.
 */
export function evaluate(form: LispValue, env: Env): LispValue {
  switch (form.kind) {
    case 'number':
    case 'string':
    case 'boolean':
    case 'nil':
    case 'function':
      return form;
    case 'symbol': {
      const v = env.lookup(form.name);
      if (v === undefined) throw new Error(`unbound symbol: ${form.name}`);
      return v;
    }
    case 'list':
      return evaluateList(form.items, env);
  }
}

function evaluateList(items: readonly LispValue[], env: Env): LispValue {
  if (items.length === 0) return NIL;
  const head = items[0]!;
  if (head.kind === 'symbol') {
    switch (head.name) {
      case 'quote':
        return items[1] ?? NIL;
      case 'if':
        return evalIf(items, env);
      case 'define':
        return evalDefine(items, env);
      case 'lambda':
        return evalLambda(items, env);
      case 'let':
        return evalLet(items, env);
      case 'cond':
        return evalCond(items, env);
      case 'begin':
        return evalBegin(items.slice(1), env);
      case 'set!':
        return evalSet(items, env);
    }
  }
  // General application.
  const fn = evaluate(head, env);
  if (fn.kind !== 'function') {
    throw new Error(`not a function: ${show(fn)}`);
  }
  const args = items.slice(1).map((a) => evaluate(a, env));
  return fn.apply(args, env);
}

function evalIf(items: readonly LispValue[], env: Env): LispValue {
  if (items.length < 3 || items.length > 4) {
    throw new Error(`if: expected 2 or 3 forms, got ${String(items.length - 1)}`);
  }
  const cond = evaluate(items[1]!, env);
  if (isTruthy(cond)) return evaluate(items[2]!, env);
  return items[3] !== undefined ? evaluate(items[3], env) : NIL;
}

function evalDefine(items: readonly LispValue[], env: Env): LispValue {
  if (items.length !== 3) throw new Error(`define: expected 2 forms, got ${String(items.length - 1)}`);
  const target = items[1]!;
  if (target.kind !== 'symbol') throw new Error('define: first form must be a symbol');
  env.define(target.name, evaluate(items[2]!, env));
  return NIL;
}

function evalLambda(items: readonly LispValue[], parentEnv: Env): LispValue {
  if (items.length < 3) throw new Error('lambda: expected (lambda (params...) body...)');
  const params = items[1]!;
  if (params.kind !== 'list' && params.kind !== 'nil') {
    throw new Error('lambda: params must be a list');
  }
  const paramNames =
    params.kind === 'nil'
      ? []
      : params.items.map((p) => {
          if (p.kind !== 'symbol') throw new Error('lambda: every param must be a symbol');
          return p.name;
        });
  const body = items.slice(2);
  return {
    kind: 'function',
    name: '<lambda>',
    apply: (args, _env) => {
      if (args.length !== paramNames.length) {
        throw new Error(
          `lambda: expected ${String(paramNames.length)} args, got ${String(args.length)}`,
        );
      }
      const local = new Env(parentEnv);
      for (let i = 0; i < paramNames.length; i++) {
        local.define(paramNames[i]!, args[i]!);
      }
      let result: LispValue = NIL;
      for (const form of body) result = evaluate(form, local);
      return result;
    },
  };
}

function evalLet(items: readonly LispValue[], env: Env): LispValue {
  // (let ((x 1) (y 2)) body...)
  if (items.length < 3) throw new Error('let: expected (let ((var val)...) body...)');
  const bindings = items[1]!;
  if (bindings.kind !== 'list') throw new Error('let: bindings must be a list');
  const local = new Env(env);
  for (const binding of bindings.items) {
    if (binding.kind !== 'list' || binding.items.length !== 2) {
      throw new Error('let: each binding must be a (var value) pair');
    }
    const name = binding.items[0]!;
    if (name.kind !== 'symbol') throw new Error('let: binding name must be a symbol');
    local.define(name.name, evaluate(binding.items[1]!, env));
  }
  let result: LispValue = NIL;
  for (const form of items.slice(2)) result = evaluate(form, local);
  return result;
}

function evalCond(items: readonly LispValue[], env: Env): LispValue {
  // (cond (test1 expr1) (test2 expr2) (else exprE))
  for (const clause of items.slice(1)) {
    if (clause.kind !== 'list' || clause.items.length === 0) {
      throw new Error('cond: each clause must be a non-empty list');
    }
    const test = clause.items[0]!;
    const isElse = test.kind === 'symbol' && test.name === 'else';
    if (isElse || isTruthy(evaluate(test, env))) {
      let result: LispValue = NIL;
      for (const expr of clause.items.slice(1)) result = evaluate(expr, env);
      return result;
    }
  }
  return NIL;
}

function evalBegin(forms: readonly LispValue[], env: Env): LispValue {
  let result: LispValue = NIL;
  for (const form of forms) result = evaluate(form, env);
  return result;
}

function evalSet(items: readonly LispValue[], env: Env): LispValue {
  if (items.length !== 3) throw new Error('set!: expected 2 forms');
  const target = items[1]!;
  if (target.kind !== 'symbol') throw new Error('set!: first form must be a symbol');
  if (env.lookup(target.name) === undefined) throw new Error(`set!: unbound symbol: ${target.name}`);
  env.define(target.name, evaluate(items[2]!, env));
  return NIL;
}

/** Scheme truthiness: only `#f` is false; everything else (incl. `()`, `0`) is truthy. */
export function isTruthy(value: LispValue): boolean {
  return !(value.kind === 'boolean' && !value.value);
}

// ───────────────────────────────────────────────────────────────────────────
// Built-in functions
// ───────────────────────────────────────────────────────────────────────────

function expectNumbers(name: string, args: readonly LispValue[]): number[] {
  return args.map((a, i) => {
    if (a.kind !== 'number') throw new Error(`${name}: arg ${String(i)} must be a number`);
    return a.value;
  });
}

function builtin(
  name: string,
  apply: (args: readonly LispValue[], env: Env) => LispValue,
): LispValue {
  return { kind: 'function', name, apply };
}

/** Returns a fresh `Env` populated with the standard built-ins. */
export function defaultEnv(): Env {
  const env = new Env(null);

  env.define(
    '+',
    builtin('+', (args) => ({ kind: 'number', value: expectNumbers('+', args).reduce((a, b) => a + b, 0) })),
  );
  env.define(
    '-',
    builtin('-', (args) => {
      const ns = expectNumbers('-', args);
      if (ns.length === 0) throw new Error('-: at least one arg required');
      if (ns.length === 1) return { kind: 'number', value: -ns[0]! };
      return { kind: 'number', value: ns.slice(1).reduce((a, b) => a - b, ns[0]!) };
    }),
  );
  env.define(
    '*',
    builtin('*', (args) => ({ kind: 'number', value: expectNumbers('*', args).reduce((a, b) => a * b, 1) })),
  );
  env.define(
    '/',
    builtin('/', (args) => {
      const ns = expectNumbers('/', args);
      if (ns.length === 0) throw new Error('/: at least one arg required');
      if (ns.length === 1) return { kind: 'number', value: 1 / ns[0]! };
      return { kind: 'number', value: ns.slice(1).reduce((a, b) => a / b, ns[0]!) };
    }),
  );

  // Comparisons
  env.define(
    '=',
    builtin('=', (args) => {
      const ns = expectNumbers('=', args);
      for (let i = 1; i < ns.length; i++) if (ns[i] !== ns[0]) return FALSE;
      return TRUE;
    }),
  );
  env.define(
    '<',
    builtin('<', (args) => {
      const ns = expectNumbers('<', args);
      for (let i = 1; i < ns.length; i++) if (!(ns[i - 1]! < ns[i]!)) return FALSE;
      return TRUE;
    }),
  );
  env.define(
    '>',
    builtin('>', (args) => {
      const ns = expectNumbers('>', args);
      for (let i = 1; i < ns.length; i++) if (!(ns[i - 1]! > ns[i]!)) return FALSE;
      return TRUE;
    }),
  );
  env.define(
    '<=',
    builtin('<=', (args) => {
      const ns = expectNumbers('<=', args);
      for (let i = 1; i < ns.length; i++) if (!(ns[i - 1]! <= ns[i]!)) return FALSE;
      return TRUE;
    }),
  );
  env.define(
    '>=',
    builtin('>=', (args) => {
      const ns = expectNumbers('>=', args);
      for (let i = 1; i < ns.length; i++) if (!(ns[i - 1]! >= ns[i]!)) return FALSE;
      return TRUE;
    }),
  );

  // List builtins
  env.define(
    'cons',
    builtin('cons', (args) => {
      if (args.length !== 2) throw new Error('cons: expected 2 args');
      const tail = args[1]!;
      const items: LispValue[] = [args[0]!];
      if (tail.kind === 'list') items.push(...tail.items);
      else if (tail.kind !== 'nil') {
        // Improper list — represent as 2-element list (no dotted-pair support in this small dialect).
        items.push(tail);
      }
      return { kind: 'list', items };
    }),
  );
  env.define(
    'car',
    builtin('car', (args) => {
      if (args.length !== 1) throw new Error('car: expected 1 arg');
      const a = args[0]!;
      if (a.kind === 'list' && a.items.length > 0) return a.items[0]!;
      throw new Error('car: empty or non-list');
    }),
  );
  env.define(
    'cdr',
    builtin('cdr', (args) => {
      if (args.length !== 1) throw new Error('cdr: expected 1 arg');
      const a = args[0]!;
      if (a.kind !== 'list' || a.items.length === 0) {
        throw new Error('cdr: empty or non-list');
      }
      const rest = a.items.slice(1);
      return rest.length === 0 ? NIL : { kind: 'list', items: rest };
    }),
  );
  env.define(
    'list',
    builtin('list', (args) => (args.length === 0 ? NIL : { kind: 'list', items: [...args] })),
  );
  env.define(
    'null?',
    builtin('null?', (args) => {
      if (args.length !== 1) throw new Error('null?: expected 1 arg');
      return args[0]!.kind === 'nil' ? TRUE : FALSE;
    }),
  );
  env.define(
    'pair?',
    builtin('pair?', (args) => {
      if (args.length !== 1) throw new Error('pair?: expected 1 arg');
      return args[0]!.kind === 'list' && args[0]!.items.length > 0 ? TRUE : FALSE;
    }),
  );

  // Boolean
  env.define(
    'not',
    builtin('not', (args) => {
      if (args.length !== 1) throw new Error('not: expected 1 arg');
      return isTruthy(args[0]!) ? FALSE : TRUE;
    }),
  );

  return env;
}

/**
 * Convenience: parse and evaluate a Lisp source string in a fresh environment.
 * Returns the value of the last top-level form.
 */
export function evaluateAll(forms: readonly LispValue[], env: Env = defaultEnv()): LispValue {
  let result: LispValue = NIL;
  for (const form of forms) result = evaluate(form, env);
  return result;
}
