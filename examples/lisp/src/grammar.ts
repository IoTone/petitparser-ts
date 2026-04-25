import type { Parser } from '../../../src/core/parser.ts';
import { GrammarDefinition } from '../../../src/definition/grammar.ts';
import { anyOf } from '../../../src/parser/character/anyOf.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import { noneOf } from '../../../src/parser/character/noneOf.ts';
import { whitespace } from '../../../src/parser/character/whitespace.ts';
import { string } from '../../../src/parser/predicate/string.ts';

import { FALSE, NIL, TRUE, type LispValue } from './types.ts';

import '../../../src/parser/_fluent/index.ts';

/* eslint-disable @typescript-eslint/unbound-method */

/**
 * Lisp grammar — a small Scheme-flavored dialect. Supports:
 *
 *   ; line comments
 *   42  -3.14                   numbers
 *   "hello\n"                   strings (standard escapes)
 *   foo  +  list?  *star*       symbols (broad char set)
 *   #t  #f                      booleans
 *   ()                          nil
 *   (a b c)                     lists
 *   'x  →  (quote x)            shorthand quote
 *
 * Returns a `Parser<LispValue[]>` from `start()` — one entry per top-level form.
 */
export class LispGrammar extends GrammarDefinition<LispValue[]> {
  override start(): Parser<LispValue[]> {
    return this.ref0(this.program).end();
  }

  /** Whole program: zero or more top-level forms, with leading/trailing space + comments. */
  program(): Parser<LispValue[]> {
    return this.ref0(this.spacing).seq(this.ref0(this.form).star()).map(([, forms]) => forms);
  }

  /** A single value, optionally followed by trailing space/comments. */
  form(): Parser<LispValue> {
    return this.ref0(this.value).seq(this.ref0(this.spacing)).map(([v]) => v);
  }

  /** Any value (no trailing space). */
  value(): Parser<LispValue> {
    return this.ref0(this.quotedForm).or(
      this.ref0(this.listForm),
      this.ref0(this.booleanLit),
      this.ref0(this.numberLit),
      this.ref0(this.stringLit),
      this.ref0(this.symbolLit),
    );
  }

  /** `'x` is sugar for `(quote x)`. */
  quotedForm(): Parser<LispValue> {
    return char("'").seq(this.ref0(this.spacing), this.ref0(this.value)).map(([, , v]) => ({
      kind: 'list',
      items: [{ kind: 'symbol', name: 'quote' }, v],
    }));
  }

  /** `(a b c)` — empty list parses as `nil`. */
  listForm(): Parser<LispValue> {
    return char('(')
      .seq(this.ref0(this.spacing), this.ref0(this.form).star(), char(')'))
      .map(([, , items]) => (items.length === 0 ? NIL : { kind: 'list', items }));
  }

  booleanLit(): Parser<LispValue> {
    return string('#t').constant(TRUE).or(string('#f').constant(FALSE));
  }

  /** Numbers: optional sign, digits, optional `.digits`. No exponent (Lisp tradition). */
  numberLit(): Parser<LispValue> {
    return char('-')
      .optional('')
      .seq(digit().plus().flatten(), char('.').seq(digit().plus().flatten()).flatten().optional(''))
      .flatten()
      .map((s) => ({ kind: 'number' as const, value: Number(s) }));
  }

  /** Strings — same escape set as JSON. */
  stringLit(): Parser<LispValue> {
    const escape = char('\\')
      .seq(anyOf('"\\nrtbf/'))
      .map(([, c]) => {
        switch (c) {
          case 'n':
            return '\n';
          case 'r':
            return '\r';
          case 't':
            return '\t';
          case 'b':
            return '\b';
          case 'f':
            return '\f';
          default:
            return c;
        }
      });
    return char('"')
      .seq(escape.or(noneOf('"\\')).star(), char('"'))
      .map(([, chars]) => ({ kind: 'string' as const, value: chars.join('') }));
  }

  /**
   * Symbols: a permissive identifier set. First char can't be a digit (so the
   * parser doesn't shadow `numberLit`), nor any of the Lisp reserved structural
   * characters `()'";` or whitespace.
   */
  symbolLit(): Parser<LispValue> {
    const symbolChar = letter().or(digit(), anyOf('+-*/<>=!?_$%&^~@.:'));
    const firstChar = letter().or(anyOf('+-*/<>=!?_$%&^~@.:'));
    return firstChar.seq(symbolChar.star()).flatten().map((name) => ({ kind: 'symbol' as const, name }));
  }

  /** Whitespace and `;`-to-EOL line comments, any amount. */
  spacing(): Parser<unknown> {
    const comment = char(';').seq(noneOf('\n').star()).flatten();
    return whitespace().or(comment).star();
  }
}
