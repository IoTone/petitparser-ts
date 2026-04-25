import { GrammarDefinition } from '../../../src/definition/grammar.ts';
import type { Parser } from '../../../src/core/parser.ts';
import { anyOf } from '../../../src/parser/character/anyOf.ts';
import { char } from '../../../src/parser/character/char.ts';
import { digit } from '../../../src/parser/character/digit.ts';
import { letter } from '../../../src/parser/character/letter.ts';
import { noneOf } from '../../../src/parser/character/noneOf.ts';
import { string } from '../../../src/parser/predicate/string.ts';

import type { ParsedUri } from './types.ts';

import '../../../src/parser/_fluent/index.ts';

/* eslint-disable @typescript-eslint/unbound-method */

/**
 * Simplified RFC 3986 URI parser:
 *
 *     scheme://[userinfo@]host[:port][/path][?query][#fragment]
 *     scheme:[/path][?query][#fragment]    (e.g. mailto:foo@bar)
 *
 * Returns a `ParsedUri` with `null` for absent components and `0` (well, `null`)
 * for absent ports. The `path` is always a string — `''` if there is none.
 */
export class UriGrammar extends GrammarDefinition<ParsedUri> {
  override start(): Parser<ParsedUri> {
    return this.ref0(this.uri).end();
  }

  uri(): Parser<ParsedUri> {
    // scheme ':' (//-authority)? path ('?' query)? ('#' fragment)?
    // RFC 3986 scheme: ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
    const scheme = letter()
      .seq(letter().or(digit(), anyOf('+-.')).star())
      .flatten();

    const authority = string('//').seq(this.ref0(this.authority));
    const query = char('?').seq(noneOf('#').star().flatten()).map(([, q]) => q);
    const fragment = char('#').seq(noneOf('').star().flatten()).map(([, f]) => f);

    return scheme
      .seq(
        char(':'),
        authority.optional(),
        this.ref0(this.path),
        query.optional(),
        fragment.optional(),
      )
      .map(([s, , auth, p, q, f]) => ({
        scheme: s,
        userinfo: auth ? auth[1].userinfo : null,
        host: auth ? auth[1].host : null,
        port: auth ? auth[1].port : null,
        path: p,
        query: q ?? null,
        fragment: f ?? null,
      }));
  }

  /** `[userinfo@]host[:port]`. */
  authority(): Parser<{ userinfo: string | null; host: string; port: number | null }> {
    const userinfo = noneOf('@/?#').plus().flatten().seq(char('@')).map(([u]) => u);
    // Host may be empty (e.g. `file:///path` has scheme=file, host='', path=/path).
    const host = noneOf(':/?#').star().flatten();
    const port = char(':').seq(digit().plus().flatten()).map(([, p]) => Number(p));
    return userinfo.optional().seq(host, port.optional()).map(([u, h, p]) => ({
      userinfo: u ?? null,
      host: h,
      port: p ?? null,
    }));
  }

  /** Path is everything from `/` (or first non-special char) up to `?` or `#`. */
  path(): Parser<string> {
    return noneOf('?#').star().flatten();
  }
}
