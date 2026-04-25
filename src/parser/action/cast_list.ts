import type { Parser } from '../../core/parser.ts';
import { map } from './map.ts';

/** Type-only cast of each list element. Runtime no-op. */
export function castList<T>(parser: Parser<readonly unknown[]>): Parser<T[]> {
  return map(parser, (list) => list as T[]);
}
