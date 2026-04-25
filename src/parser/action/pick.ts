import type { Parser } from '../../core/parser.ts';
import { map } from './map.ts';

/**
 * Pick the `index`-th element of an array result. Negative indexes count
 * from the end (`-1` is the last element). Useful with `seq`/`SequenceParser`
 * to keep one piece and discard the others:
 *
 *     pick(seq(string('"'), digit().star(), string('"')), 1) // -> string[]
 */
export function pick<R>(parser: Parser<readonly R[]>, index: number): Parser<R> {
  return map(parser, (list) => {
    const i = index < 0 ? list.length + index : index;
    if (i < 0 || i >= list.length) {
      throw new RangeError(
        `pick(${String(index)}) out of bounds for list of length ${String(list.length)}`,
      );
    }
    return list[i] as R;
  });
}
