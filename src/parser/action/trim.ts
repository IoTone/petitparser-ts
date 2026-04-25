import type { Context } from '../../core/context.ts';
import type { Parser } from '../../core/parser.ts';
import { success, type Result } from '../../core/result.ts';
import { whitespace } from '../character/whitespace.ts';
import { DelegateParser } from '../combinator/delegate.ts';

/**
 * Skips matches of `before` (default: `whitespace().star()`-equivalent) before
 * the inner parser, and `after` (default: same as `before`) after. The trimmer
 * matches are tried repeatedly while they succeed, so a single `whitespace()`
 * trimmer eats arbitrary leading/trailing whitespace runs.
 */
export class TrimParser<R> extends DelegateParser<R, R> {
  before: Parser<unknown>;
  after: Parser<unknown>;

  constructor(parser: Parser<R>, before: Parser<unknown>, after: Parser<unknown>) {
    super(parser);
    this.before = before;
    this.after = after;
  }

  override parseOn(context: Context): Result<R> {
    let cursor = consumeAll(this.before, context);
    const main = this.delegate.parseOn(cursor);
    if (main.kind === 'failure') return main;
    cursor = consumeAll(this.after, { buffer: main.buffer, position: main.position });
    return success(cursor, main.value, cursor.position);
  }

  override fastParseOn(buffer: string, position: number): number {
    let cursor = consumeAllFast(this.before, buffer, position);
    cursor = this.delegate.fastParseOn(buffer, cursor);
    if (cursor < 0) return -1;
    return consumeAllFast(this.after, buffer, cursor);
  }

  override get children(): readonly Parser<unknown>[] {
    return [this.delegate, this.before, this.after];
  }

  override replace(source: Parser<unknown>, target: Parser<unknown>): void {
    super.replace(source, target);
    if (this.before === source) this.before = target;
    if (this.after === source) this.after = target;
  }
}

function consumeAll(trim: Parser<unknown>, context: Context): Context {
  let cursor = context;
  while (true) {
    const r = trim.parseOn(cursor);
    if (r.kind === 'failure' || r.position === cursor.position) return cursor;
    cursor = { buffer: r.buffer, position: r.position };
  }
}

function consumeAllFast(trim: Parser<unknown>, buffer: string, position: number): number {
  let cursor = position;
  while (true) {
    const next = trim.fastParseOn(buffer, cursor);
    if (next < 0 || next === cursor) return cursor;
    cursor = next;
  }
}

const DEFAULT_TRIM = whitespace();

export function trim<R>(
  parser: Parser<R>,
  before: Parser<unknown> = DEFAULT_TRIM,
  after: Parser<unknown> = before,
): Parser<R> {
  return new TrimParser(parser, before, after);
}
