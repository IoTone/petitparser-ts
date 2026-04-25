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
export { LabelParser, label } from './parser/misc/label.ts';
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

// Character predicate algebra
export type { CharacterPredicate } from './parser/character/predicate/character_predicate.ts';
export { ConstantCharPredicate } from './parser/character/predicate/constant.ts';
export { NotCharPredicate, negatePredicate } from './parser/character/predicate/not.ts';
export { RangeCharPredicate } from './parser/character/predicate/range.ts';
export { RangesCharPredicate, rangesPredicate } from './parser/character/predicate/ranges.ts';
export { SingleCharacterPredicate } from './parser/character/predicate/single_character.ts';

// String predicate
export { StringParser, string, type StringOptions } from './parser/predicate/string.ts';

// Combinators
export { AndParser, and } from './parser/combinator/and.ts';
export {
  ChoiceParser,
  selectFarthest,
  selectFarthestJoined,
  selectLast,
  type FailureJoiner,
} from './parser/combinator/choice.ts';
export { DelegateParser } from './parser/combinator/delegate.ts';
export { EndParser, end } from './parser/combinator/end.ts';
export { ListParser } from './parser/combinator/list.ts';
export { NegParser, neg } from './parser/combinator/neg.ts';
export { NotParser, not } from './parser/combinator/not.ts';
export { OptionalParser, optional } from './parser/combinator/optional.ts';
export { type ChoiceResult, or, orWith } from './parser/combinator/or.ts';
export { type SequenceResult, seq } from './parser/combinator/seq.ts';
export { SequenceParser } from './parser/combinator/sequence.ts';
export { SettableParser, settable } from './parser/combinator/settable.ts';
export { SkipParser, skip } from './parser/combinator/skip.ts';

// Repeaters
export { GreedyRepeatingParser, plusGreedy, repeatGreedy, starGreedy } from './parser/repeater/greedy.ts';
export { LazyRepeatingParser, plusLazy, repeatLazy, starLazy } from './parser/repeater/lazy.ts';
export { LimitedRepeatingParser } from './parser/repeater/limited.ts';
export { PossessiveRepeatingParser, plus, repeat, star, times } from './parser/repeater/possessive.ts';
export { RepeatingParser, UNBOUNDED } from './parser/repeater/repeating.ts';
export {
  SeparatedList,
  SeparatedRepeatingParser,
  plusSeparated,
  repeatSeparated,
  starSeparated,
  timesSeparated,
} from './parser/repeater/separated.ts';
export {
  RepeatingCharacterParser,
  plusString,
  repeatString,
  starString,
  timesString,
} from './parser/repeater/character.ts';

// Actions
export { MapParser, map } from './parser/action/map.ts';
export { pick } from './parser/action/pick.ts';
export { permute } from './parser/action/permute.ts';
export { cast } from './parser/action/cast.ts';
export { castList } from './parser/action/cast_list.ts';
export { constant } from './parser/action/constant.ts';
export { WhereParser, where } from './parser/action/where.ts';
export { FlattenParser, flatten } from './parser/action/flatten.ts';
export { TokenParser, token } from './parser/action/token.ts';
export { TrimParser, trim } from './parser/action/trim.ts';
export { labeled } from './parser/action/labeled.ts';

// Matcher
export {
  allMatches,
  type AllMatchesOptions,
  type ParserMatch,
} from './matcher/matches.ts';
export { toPattern, type ParserPattern } from './matcher/pattern.ts';

// Definition
export { GrammarDefinition } from './definition/grammar.ts';

// Expression builder
export { ExpressionBuilder } from './expression/builder.ts';
export { ExpressionGroup } from './expression/group.ts';

// Reflection
export { allParser } from './reflection/iterable.ts';
export { transformParser } from './reflection/transform.ts';
export {
  FlattenChoice,
  RemoveDuplicate,
  allOptimizerRules,
  optimize,
  type OptimizeOptions,
  type OptimizerRule,
} from './reflection/optimize.ts';
export {
  LeftRecursionRule,
  UnresolvedSettableRule,
  allLinterRules,
  linter,
  type LinterIssue,
  type LinterOptions,
  type LinterRule,
  type LinterType,
} from './reflection/linter.ts';

// Debug
export { profile, type ProfileFrame, type ProfileOptions } from './debug/profile.ts';
export { trace, type TraceEvent, type TraceOptions } from './debug/trace.ts';
export { progress, type ProgressFrame, type ProgressOptions } from './debug/progress.ts';

// Install fluent / instance-method API on Parser.prototype and CharacterParser.prototype.
import './parser/_fluent/index.ts';
