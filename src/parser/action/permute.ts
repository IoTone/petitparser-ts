import type { Parser } from '../../core/parser.ts';
import { map } from './map.ts';

/**
 * Reorders an array result by the given indexes. Negative indexes count from
 * the end. Useful for keeping a subset of a sequence in a chosen order:
 *
 *     permute(seq(a, b, c), [2, 0]) // -> [c, a]
 */
export function permute<R>(parser: Parser<readonly R[]>, indexes: readonly number[]): Parser<R[]> {
  return map(parser, (list) =>
    indexes.map((idx) => {
      const i = idx < 0 ? list.length + idx : idx;
      if (i < 0 || i >= list.length) {
        throw new RangeError(
          `permute index ${String(idx)} out of bounds for list of length ${String(list.length)}`,
        );
      }
      return list[i] as R;
    }),
  );
}
