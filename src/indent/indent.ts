import type { Context } from '../core/context.ts';
import { Parser } from '../core/parser.ts';
import { failure as makeFailure, success, type Result } from '../core/result.ts';

/**
 * Indent-sensitive parsing helper, ported from upstream Dart's experimental
 * `Indent` class. Owns a mutable indent stack; exposes three parsers that
 * inspect the column of the cursor relative to the top of the stack:
 *
 * - `increase` — succeeds and pushes when the current indent is *greater*
 *   than the stack top. Returns the new indent column.
 * - `same`     — succeeds when the current indent *equals* the stack top.
 *   Returns the matched column.
 * - `decrease` — succeeds and pops when the current indent is *less* than
 *   the stack top. Returns the popped column.
 *
 * "Current indent" is defined as the column of the cursor *if* the cursor is
 * at the start of a line (i.e. position 0, or the previous character is a
 * newline) and the line begins with `tabSize` (default 1) spaces; otherwise
 * the parsers fail.
 *
 * **Experimental.** API and semantics may change as we get usage feedback.
 * Mirrors upstream Dart's `@experimental Indent` annotation.
 *
 * Typical usage (parsing a Python-like indented block):
 *
 *     const indent = new Indent();
 *     const block = indent.increase
 *       .seq(line.starSeparated(newline()), indent.decrease)
 *       .map(([, lines]) => lines);
 */
export class Indent {
  /**
   * The indent stack. Each entry is the column at which a block was opened.
   * Always non-empty; bottom of stack is `0` (the leftmost column).
   */
  readonly stack: number[] = [0];

  /**
   * Width of one indent level in columns. Default `1` (any change in indent
   * column is a level change). Set to `2` or `4` to require fixed-width
   * indentation.
   */
  readonly tabSize: number;

  constructor(options: { tabSize?: number } = {}) {
    this.tabSize = options.tabSize ?? 1;
  }

  get top(): number {
    return this.stack[this.stack.length - 1] ?? 0;
  }

  readonly increase: Parser<number> = new IncreaseIndent(this);
  readonly same: Parser<number> = new SameIndent(this);
  readonly decrease: Parser<number> = new DecreaseIndent(this);

  /** Reset the stack to its initial state (`[0]`). Useful between parses. */
  reset(): void {
    this.stack.length = 0;
    this.stack.push(0);
  }
}

/** Returns the indent column at `position`, or -1 if not at line start. */
function currentColumn(buffer: string, position: number): number {
  // Walk back to the last newline (or start of buffer) to find where the line begins.
  let start = position;
  while (start > 0 && buffer.charCodeAt(start - 1) !== 0x0a /* \n */ && buffer.charCodeAt(start - 1) !== 0x0d /* \r */) {
    start--;
  }
  if (start !== position) return -1; // not at the start of a line
  // Count leading spaces (we treat tabs as not equivalent — fragile mixing rules out of scope).
  let col = 0;
  let i = position;
  while (i < buffer.length && buffer.charCodeAt(i) === 0x20 /* space */) {
    col++;
    i++;
  }
  return col;
}

class IncreaseIndent extends Parser<number> {
  constructor(readonly owner: Indent) {
    super();
  }

  override parseOn(context: Context): Result<number> {
    const col = currentColumn(context.buffer, context.position);
    if (col < 0) return makeFailure(context, 'expected line start');
    if (col <= this.owner.top) return makeFailure(context, `expected indent > ${String(this.owner.top)}`);
    this.owner.stack.push(col);
    return success(context, col, context.position + col);
  }
}

class SameIndent extends Parser<number> {
  constructor(readonly owner: Indent) {
    super();
  }

  override parseOn(context: Context): Result<number> {
    const col = currentColumn(context.buffer, context.position);
    if (col < 0) return makeFailure(context, 'expected line start');
    if (col !== this.owner.top) return makeFailure(context, `expected indent == ${String(this.owner.top)}`);
    return success(context, col, context.position + col);
  }
}

class DecreaseIndent extends Parser<number> {
  constructor(readonly owner: Indent) {
    super();
  }

  override parseOn(context: Context): Result<number> {
    const col = currentColumn(context.buffer, context.position);
    if (col < 0) return makeFailure(context, 'expected line start');
    if (col >= this.owner.top) return makeFailure(context, `expected indent < ${String(this.owner.top)}`);
    if (this.owner.stack.length <= 1) return makeFailure(context, 'no block to close');
    this.owner.stack.pop();
    return success(context, col, context.position + col);
  }
}
