import type { Parser } from '../../core/parser.ts';
import { FailureParser } from '../misc/failure.ts';
import { DelegateParser } from './delegate.ts';

/**
 * Forward-reference parser. Returns a placeholder parser whose actual
 * implementation can be installed later via `.set(parser)`. Used to define
 * recursive grammars without temporal coupling.
 *
 *     const expr = settable<number>();
 *     // ... build something that references expr ...
 *     expr.set(buildExpr());
 */
export class SettableParser<R> extends DelegateParser<R, R> {
  set(parser: Parser<R>): void {
    this.delegate = parser;
  }
}

/**
 * Build a settable parser. Defaults its delegate to a `FailureParser` that
 * complains "undefined parser" — this surfaces forgotten `.set()` calls
 * loudly during development rather than silently succeeding.
 */
export function settable<R>(message = 'undefined parser'): SettableParser<R> {
  return new SettableParser<R>(new FailureParser(message));
}
