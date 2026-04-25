import type { Context } from '../../core/context.ts';
import { Parser } from '../../core/parser.ts';
import { type Result, success } from '../../core/result.ts';

/**
 * Wraps `parser` so that an optional `before` parser runs first and an
 * optional `after` parser runs last; both `before` and `after` are tried
 * unconditionally and their values are discarded.
 *
 * Equivalent to `(before & parser & after).pick(1)` for the both-given case,
 * but expressed directly so it doesn't depend on `seq` / `pick`.
 */
export class SkipParser<R> extends Parser<R> {
  readonly delegate: Parser<R>;
  readonly before: Parser<unknown> | null;
  readonly after: Parser<unknown> | null;

  constructor(delegate: Parser<R>, before: Parser<unknown> | null, after: Parser<unknown> | null) {
    super();
    this.delegate = delegate;
    this.before = before;
    this.after = after;
  }

  override parseOn(context: Context): Result<R> {
    let cursor: Context = context;
    if (this.before) {
      const r = this.before.parseOn(cursor);
      if (r.kind === 'failure') return r;
      cursor = { buffer: r.buffer, position: r.position };
    }
    const main = this.delegate.parseOn(cursor);
    if (main.kind === 'failure') return main;
    cursor = { buffer: main.buffer, position: main.position };
    if (this.after) {
      const r = this.after.parseOn(cursor);
      if (r.kind === 'failure') return r;
      cursor = { buffer: r.buffer, position: r.position };
    }
    return success(cursor, main.value, cursor.position);
  }

  override fastParseOn(buffer: string, position: number): number {
    let cursor = position;
    if (this.before) {
      cursor = this.before.fastParseOn(buffer, cursor);
      if (cursor < 0) return -1;
    }
    cursor = this.delegate.fastParseOn(buffer, cursor);
    if (cursor < 0) return -1;
    if (this.after) {
      cursor = this.after.fastParseOn(buffer, cursor);
      if (cursor < 0) return -1;
    }
    return cursor;
  }

  override get children(): readonly Parser<unknown>[] {
    const c: Parser<unknown>[] = [this.delegate];
    if (this.before) c.push(this.before);
    if (this.after) c.push(this.after);
    return c;
  }
}

export function skip<R>(
  parser: Parser<R>,
  options: { before?: Parser<unknown>; after?: Parser<unknown> } = {},
): Parser<R> {
  return new SkipParser(parser, options.before ?? null, options.after ?? null);
}
