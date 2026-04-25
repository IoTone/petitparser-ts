import type { Parser } from '../../core/parser.ts';
import { CharacterParser } from './character_parser.ts';
import { SingleCharacterPredicate } from './predicate/single_character.ts';

/** Matches exactly the single-character string `c`. */
export function char(c: string, options: { message?: string } = {}): Parser<string> {
  if (c.length !== 1) {
    throw new Error(`char() expects a single-character string, got ${JSON.stringify(c)}`);
  }
  return new CharacterParser(
    new SingleCharacterPredicate(c.charCodeAt(0)),
    options.message ?? `${JSON.stringify(c)} expected`,
  );
}
