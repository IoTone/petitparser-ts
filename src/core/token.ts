/**
 * Wraps a parsed value with its source location.
 *
 * Mirrors `lib/src/core/token.dart` from upstream Dart PetitParser. Phase 1
 * defines the data shape and the `lineAndColumnOf` helper; the `Parser.token()`
 * action that produces these arrives in Phase 3.
 */
export class Token<R> {
  readonly value: R;
  readonly buffer: string;
  readonly start: number;
  readonly stop: number;

  constructor(value: R, buffer: string, start: number, stop: number) {
    this.value = value;
    this.buffer = buffer;
    this.start = start;
    this.stop = stop;
  }

  get length(): number {
    return this.stop - this.start;
  }

  get input(): string {
    return this.buffer.substring(this.start, this.stop);
  }

  get line(): number {
    return Token.lineAndColumnOf(this.buffer, this.start)[0];
  }

  get column(): number {
    return Token.lineAndColumnOf(this.buffer, this.start)[1];
  }

  toString(): string {
    return `Token[start: ${String(this.start)}, stop: ${String(this.stop)}, value: ${String(this.value)}]`;
  }

  /**
   * Converts a `position` index in `buffer` to a 1-based `[line, column]` tuple.
   *
   * Newlines: `\n`, `\r`, and `\r\n` are each one line break. The character at
   * `position` is on line `line` and column `column`. Walks `buffer` linearly
   * up to `position` — O(position).
   */
  static lineAndColumnOf(buffer: string, position: number): [line: number, column: number] {
    let line = 1;
    let lineStart = 0;
    let i = 0;
    const limit = Math.min(position, buffer.length);
    while (i < limit) {
      const ch = buffer.charCodeAt(i);
      if (ch === 0x0d /* \r */) {
        // CRLF only counts as a line break if both halves end at or before `limit`,
        // so a query position equal to the `\n` of a CRLF pair stays on the prior line.
        if (i + 1 < buffer.length && buffer.charCodeAt(i + 1) === 0x0a /* \n */) {
          if (i + 2 > limit) break;
          line++;
          i += 2;
          lineStart = i;
        } else {
          line++;
          i++;
          lineStart = i;
        }
      } else if (ch === 0x0a /* \n */) {
        line++;
        i++;
        lineStart = i;
      } else {
        i++;
      }
    }
    return [line, position - lineStart + 1];
  }
}
