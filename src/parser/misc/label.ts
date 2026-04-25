import { DelegateParser } from '../combinator/delegate.ts';
import type { Parser } from '../../core/parser.ts';

/**
 * Wraps `parser` with a debug name. Pure pass-through at runtime; the name
 * surfaces in `toString()` and (in Phase 5) in the linter / tracer output.
 */
export class LabelParser<R> extends DelegateParser<R, R> {
  readonly name: string;

  constructor(name: string, parser: Parser<R>) {
    super(parser);
    this.name = name;
  }

  override toString(): string {
    return `LabelParser[${this.name}]`;
  }

  // Note: toString is inherited via DelegateParser → Parser; `override` enforced.
}

/** Tag a parser with a human-readable name for debugging. */
export function label<R>(name: string, parser: Parser<R>): Parser<R> {
  return new LabelParser(name, parser);
}
