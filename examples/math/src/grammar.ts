import type { Parser } from '../../../src/core/parser.ts';
import { ExpressionBuilder } from '../../../src/expression/builder.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';

import '../../../src/parser/_fluent/index.ts';

/**
 * Arithmetic expression grammar built with `ExpressionBuilder`. Evaluates as
 * it parses — no separate AST. Returns a `Parser<number>`.
 *
 * Operators (lowest to highest precedence):
 *   `+`, `-`        left-associative binary
 *   `*`, `/`        left-associative binary
 *   `^`             right-associative binary (so `2^3^2 == 512`)
 *   `-`, `(...)`    unary minus and parens (highest)
 *
 * Decision flagged in Phase 4: unary `-` lives at the highest precedence,
 * which means `-2^2 == 4`, not the textbook `-4`. Move the unary group between
 * the multiplicative and exponential groups to flip that.
 */
export function buildMathParser(): Parser<number> {
  const number = digit().plus().flatten().trim().map(Number);

  const builder = new ExpressionBuilder<number>();
  builder.primitive(number);

  builder.group()
    .left(char('+').trim(), (l, _, r) => l + r)
    .left(char('-').trim(), (l, _, r) => l - r);

  builder.group()
    .left(char('*').trim(), (l, _, r) => l * r)
    .left(char('/').trim(), (l, _, r) => l / r);

  builder.group()
    .right(char('^').trim(), (l, _, r) => l ** r);

  builder.group()
    .prefix(char('-').trim(), (_, v) => -v)
    .wrapper(char('(').trim(), char(')').trim(), (_l, v, _r) => v);

  return builder.build();
}
