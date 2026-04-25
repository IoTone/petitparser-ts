// Core
export { context, type Context } from './core/context.ts';
export { ParserException } from './core/exception.ts';
export { Parser } from './core/parser.ts';
export {
  failure as failureResult,
  success as successResult,
  type Failure,
  type Result,
  type Success,
} from './core/result.ts';
export { Token } from './core/token.ts';

// Misc parsers
export { EndOfInputParser, endOfInput } from './parser/misc/end_of_input.ts';
export { EpsilonParser, epsilon, epsilonWith } from './parser/misc/epsilon.ts';
export { FailureParser, failure } from './parser/misc/failure.ts';
export { NewlineParser, newline } from './parser/misc/newline.ts';
export { PositionParser, position } from './parser/misc/position.ts';

// Character parsers
export { CharacterParser } from './parser/character/character_parser.ts';
export { any } from './parser/character/any.ts';
export { anyOf } from './parser/character/anyOf.ts';
export { char } from './parser/character/char.ts';
export { digit } from './parser/character/digit.ts';
export { letter } from './parser/character/letter.ts';
export { lowercase } from './parser/character/lowercase.ts';
export { noneOf } from './parser/character/noneOf.ts';
export { pattern } from './parser/character/pattern.ts';
export { predicate } from './parser/character/predicate.ts';
export { range } from './parser/character/range.ts';
export { uppercase } from './parser/character/uppercase.ts';
export { whitespace } from './parser/character/whitespace.ts';
export { word } from './parser/character/word.ts';

// Character predicate algebra (for advanced users / future combinators)
export type { CharacterPredicate } from './parser/character/predicate/character_predicate.ts';
export { ConstantCharPredicate } from './parser/character/predicate/constant.ts';
export { NotCharPredicate, negatePredicate } from './parser/character/predicate/not.ts';
export { RangeCharPredicate } from './parser/character/predicate/range.ts';
export { RangesCharPredicate, rangesPredicate } from './parser/character/predicate/ranges.ts';
export { SingleCharacterPredicate } from './parser/character/predicate/single_character.ts';

// String predicate
export { StringParser, string, type StringOptions } from './parser/predicate/string.ts';
