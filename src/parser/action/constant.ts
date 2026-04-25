import type { Parser } from '../../core/parser.ts';
import { map } from './map.ts';

/** Replaces any successful value with `value`. Equivalent to `.map(() => value)`. */
export function constant<R, V>(parser: Parser<R>, value: V): Parser<V> {
  return map(parser, () => value);
}
