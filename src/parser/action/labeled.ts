import type { Parser } from '../../core/parser.ts';
import { LabelParser } from '../misc/label.ts';

/**
 * Action-style alias for `label(name, parser)` — keeps grammars readable when
 * tagging productions inline. Phase 5 reflection / linter output uses these
 * names.
 */
export function labeled<R>(parser: Parser<R>, name: string): Parser<R> {
  return new LabelParser(name, parser);
}
