# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 7 — Unicode, indent-sensitive, polish

- **Unicode support**: `any`, `char`, `range`, `anyOf`, `noneOf` accept
  `{ unicode: true }`. In Unicode mode the parser advances by Unicode code
  point (1 or 2 UTF-16 code units), so surrogate-pair characters like `'𝕏'`
  or emoji are matched as single characters. Default UTF-16 mode is unchanged.
- **Indent-sensitive parsing** (`@experimental`): `Indent` class with
  `increase` / `same` / `decrease` parsers and a mutable indent stack, useful
  for Python-style block grammars.
- **TypeDoc setup**: `pnpm docs` generates an API reference site at
  `docs/api/`. Configured via `typedoc.json`.
- **Tutorial**: `docs/tutorial.md` walks through the full library API by
  building up to a complete JSON parser.

### Phase 6 — Examples

- **JSON** parser (RFC 8259 — full string escapes, scientific numbers, byte-
  identical to `JSON.parse`).
- **URI** parser (simplified RFC 3986 — scheme/userinfo/host/port/path/query/
  fragment, supports `mailto:` and `file://`).
- **Math** evaluator built with `ExpressionBuilder`.
- **Lisp** parser + tree-walking evaluator (Scheme-flavored: closures,
  `define`, `lambda`, `let`, `cond`, `set!`, recursive list operations).
- **Prolog** parser + Robinson unification (with optional occurs check) +
  generator-based SLD resolution. Handles classic examples (`parent`/
  `grandparent`, `member/2`, `append/3` in both forward and reverse mode).

### Phase 5 — Reflection & debug

- `copy()` and `replace(source, target)` machinery on every parser with
  mutable child slots. Foundation for graph rewriting.
- `allParser(root)` lazy depth-first traversal with cycle handling.
- `transformParser(root, fn)` graph rewriter; rebuilds via `copy + replace`,
  resolves cycles via `SettableParser` placeholders.
- `optimize(parser, { rules })` with `FlattenChoice` (collapses nested
  `ChoiceParser`s) and a `RemoveDuplicate` placeholder hook for future
  structural-equality dedup.
- `linter(parser, { rules })` with `LeftRecursionRule` (direct + indirect)
  and `UnresolvedSettableRule`.
- `debug/{profile,trace,progress}` — wrap every parser with a counting +
  timing proxy, hierarchical call trace, or backtracking visualization.

### Phase 4 — `ExpressionBuilder<T>`

- `ExpressionBuilder<T>` with `primitive`, `group`, public `loopback` for
  recursion through wrappers.
- `ExpressionGroup<T>` operators: `wrapper`, `prefix`, `postfix`,
  `left` (associative), `right` (associative), `optional`. Implementation
  uses only the free-function combinators — no fluent surface dependency.

### Phase 3 — Actions, matcher, definition

- Actions: `map`, `pick`, `permute`, `cast`, `castList`, `constant`, `where`,
  `flatten`, `token`, `trim`, `labeled`. All available as both free functions
  and fluent methods on `Parser.prototype`.
- Matcher: `allMatches(parser, input, { start?, overlapping? })` lazy
  iterator yielding `ParserMatch<R>` (a `Success<R>` enriched with the start
  position). `toPattern(parser)` returns a stateful `RegExp`-shaped adapter.
- Definition: `GrammarDefinition<R>` with abstract `start()`, `build()`,
  `buildFrom<T>(parser)`, and `ref0..ref5` (memoized per-`(grammar, method)`).

### Phase 2 — Combinators & repeaters

- Combinators: `SequenceParser`, `ChoiceParser` (with `selectLast` /
  `selectFarthest` / `selectFarthestJoined` failure-joiner strategies),
  `OptionalParser`, `AndParser`, `NotParser`, `NegParser`, `SettableParser`,
  `SkipParser`, `EndParser`, plus `DelegateParser` and `ListParser` bases.
- Variadic typed `seq(...ps)` and `or(...ps)` with full tuple inference.
- Repeaters: possessive (`star` / `plus` / `times` / `repeat`), greedy /
  lazy variants with a follow-set limit parser, separated (`starSeparated`
  etc., yielding a typed `SeparatedList<R, S>`), and a `RepeatingCharacter`
  fast path (`starString` / `plusString` / ...) for `CharacterParser` inputs
  that emits a flat substring instead of an array.
- Fluent API installed via TypeScript module augmentation in
  `src/parser/_fluent/`.

### Phase 1 — Core rewrite

- `src/core/`: generic `Parser<R>`, immutable `Context`, discriminated-union
  `Result<R> = Success<R> | Failure`, `Token<R>` with `lineAndColumnOf`,
  `ParserException`.
- `src/parser/misc/`: `epsilon` / `epsilonWith`, `failure`, `endOfInput`,
  `position`, `newline`.
- `src/parser/character/`: `any`, `char`, `digit`, `letter`, `lowercase`,
  `uppercase`, `whitespace`, `word`, `range`, `pattern`, `anyOf`, `noneOf`,
  `predicate` — backed by a lookup-table `CharacterPredicate` algebra.
- `src/parser/predicate/string.ts`: `string(s, { ignoreCase, message })`.

### Phase 0 — Foundation

- Modern TypeScript scaffold: strict `tsconfig.json` (ES2022, ESM,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Build via `tsup` (dual ESM/CJS + `.d.ts`). Tests via `vitest`. Lint via
  `eslint` flat config + `typescript-eslint`. Format via `prettier`. CI on
  Node 20 / 22.
- 2014 source moved to `legacy/` for cross-checking behavior; QUnit harness
  and Grunt pipeline removed.

## Notes

This project is a fork-only modernization of the 2013–2014 TypeScript port by
Rasmus Schultz, tracking modern Dart PetitParser (currently 7.0.2) for design
reference. Pre-1.0 versions are not API-stable. See `modernize-petit-parser-ts-port.md`
for the phased roadmap.
