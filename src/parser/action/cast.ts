import type { Parser } from '../../core/parser.ts';
import { map } from './map.ts';

/**
 * Type-only cast — runtime no-op. Use when you know the parser produces a
 * narrower type than its declared one (typically `unknown` or `Parser<R>` from
 * a settable forward reference where `R` was widened for cyclical reasons).
 *
 *     const expr: Parser<unknown> = settable();
 *     // ... assemble grammar ...
 *     const typed = cast<Expression>(expr);
 */
export function cast<T>(parser: Parser<unknown>): Parser<T> {
  return map(parser, (value) => value as T);
}
