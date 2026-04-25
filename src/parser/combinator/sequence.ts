import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { ListParser } from './list.ts';

/**
 * Runs each child parser in order, threading the position through. Succeeds
 * with an array of every child's value (in order). Fails as soon as any child
 * fails, returning that child's failure verbatim (including its position).
 */
export class SequenceParser<R> extends ListParser<readonly R[]> {
  override parseOn(context: Context): Result<readonly R[]> {
    const values: R[] = new Array(this.parsers.length) as R[];
    let cursor: Context = context;
    for (let i = 0; i < this.parsers.length; i++) {
      const child = this.parsers[i] as Parser<R>;
      const result = child.parseOn(cursor);
      if (result.kind === 'failure') return result;
      values[i] = result.value;
      cursor = { buffer: result.buffer, position: result.position };
    }
    return success(cursor, values, cursor.position);
  }

  override fastParseOn(buffer: string, position: number): number {
    let cursor = position;
    for (let i = 0; i < this.parsers.length; i++) {
      cursor = this.parsers[i]!.fastParseOn(buffer, cursor);
      if (cursor < 0) return -1;
    }
    return cursor;
  }
}
