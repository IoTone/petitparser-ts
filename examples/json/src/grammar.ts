import { GrammarDefinition } from '../../../src/definition/grammar.ts';
import type { Parser } from '../../../src/core/parser.ts';
import { anyOf } from '../../../src/parser/character/anyOf.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { noneOf } from '../../../src/parser/character/noneOf.ts';
import { pattern } from '../../../src/parser/character/pattern.ts';
import { string } from '../../../src/parser/predicate/string.ts';

import type { JsonValue } from './types.ts';

// Pull in the fluent surface so methods like .seq(), .or(), .map(), etc. exist.
import '../../../src/parser/_fluent/index.ts';

/* eslint-disable @typescript-eslint/unbound-method */

/**
 * RFC 8259 JSON parser, written as a `GrammarDefinition`. The result of
 * `parse(input).value` is a `JsonValue` — structurally identical to what
 * `JSON.parse(input)` returns for valid JSON.
 *
 * Example:
 *
 *     const json = new JsonGrammar().build();
 *     json.parse('{"x":[1,2,3]}').value  // { x: [1, 2, 3] }
 */
export class JsonGrammar extends GrammarDefinition<JsonValue> {
  override start(): Parser<JsonValue> {
    return this.ref0(this.value).end();
  }

  /** Any JSON value, surrounded by optional whitespace. */
  value(): Parser<JsonValue> {
    return this.ref0(this.objectValue)
      .or(
        this.ref0(this.arrayValue),
        this.ref0(this.stringValue),
        this.ref0(this.numberValue),
        this.ref0(this.trueValue),
        this.ref0(this.falseValue),
        this.ref0(this.nullValue),
      )
      .trim();
  }

  /** `{}` or `{ key: value, ... }`. */
  objectValue(): Parser<{ [key: string]: JsonValue }> {
    return char('{')
      .trim()
      .seq(this.ref0(this.objectMember).starSeparated(char(',').trim()), char('}').trim())
      .map(([, members]) => {
        const out: { [key: string]: JsonValue } = {};
        for (const [k, v] of members.elements) out[k] = v;
        return out;
      });
  }

  /** `"key": value` — note this returns `[string, JsonValue]` for the parent object to assemble. */
  objectMember(): Parser<readonly [string, JsonValue]> {
    return this.ref0(this.stringValue)
      .seq(char(':').trim(), this.ref0(this.value))
      .map(([k, , v]) => [k, v] as const);
  }

  /** `[]` or `[ value, ... ]`. */
  arrayValue(): Parser<JsonValue[]> {
    return char('[')
      .trim()
      .seq(this.ref0(this.value).starSeparated(char(',').trim()), char(']').trim())
      .map(([, items]) => [...items.elements]);
  }

  /** `"chars"` with the standard escape set, including `\uXXXX`. */
  stringValue(): Parser<string> {
    return char('"')
      .seq(this.ref0(this.stringChar).star(), char('"'))
      .map(([, chars]) => chars.join(''));
  }

  /** A single string character: a literal, an escape, or a Unicode escape. */
  stringChar(): Parser<string> {
    // \uXXXX → BMP code unit
    const hex4 = pattern('0-9a-fA-F').times(4).flatten().map((s) => String.fromCharCode(parseInt(s, 16)));
    const unicodeEscape = char('\\').seq(char('u'), hex4).map(([, , c]) => c);
    // Only the eight legal escape characters can follow `\`. Invalid escapes
    // like `\x` MUST be a parse failure (not a runtime throw), so we restrict
    // the post-backslash character set with `anyOf` rather than catching
    // arbitrary chars in `.map()`.
    const escapeMap: Record<string, string> = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    };
    const simpleEscape = char('\\')
      .seq(anyOf('"\\/bfnrt'))
      .map(([, c]) => escapeMap[c] as string);
    return unicodeEscape.or(simpleEscape, noneOf('"\\'));
  }

  /** RFC 8259 number: optional `-`, integer part, optional fraction, optional exponent. */
  numberValue(): Parser<number> {
    const minus = char('-').optional('');
    const intPart = char('0').or(pattern('1-9').seq(digit().star()).flatten());
    const frac = char('.').seq(digit().plus().flatten()).flatten().optional('');
    const exp = pattern('eE')
      .seq(pattern('+-').optional(''), digit().plus().flatten())
      .flatten()
      .optional('');
    return minus
      .seq(intPart, frac, exp)
      .flatten()
      .map(Number);
  }

  trueValue(): Parser<boolean> {
    return string('true').constant(true);
  }

  falseValue(): Parser<boolean> {
    return string('false').constant(false);
  }

  nullValue(): Parser<null> {
    return string('null').constant(null);
  }
}
