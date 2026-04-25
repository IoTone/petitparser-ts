# Modernization Plan — petitparser-ts

A plan to revive this TypeScript port of [PetitParser](https://github.com/petitparser/dart-petitparser) (last touched 2014) and bring it to feature parity with modern upstream **Dart PetitParser 7.0.2** (Feb 2026), plus port the high-value examples from [`dart-petitparser-examples`](https://github.com/petitparser/dart-petitparser-examples).

---

## 1. Goals & Non-Goals

### Goals
- Modern, strict TypeScript (5.x) with a strongly-typed `Parser<R>` surface — generics carry result types end-to-end.
- Match upstream Dart 7.0.2 conceptual API one-for-one where TS allows; document deviations where it doesn't (operator overloading, named args, Records).
- Modern build/test/publish: ESM-first dual-build, Vitest, tsup/tsc, GitHub Actions CI, published to npm as `@iotone/petitparser` (or successor org name — TBD with maintainer).
- Faithful TS ports of the core upstream examples — JSON, URI, Math (ExpressionBuilder), Lisp, Prolog — usable as both demos and integration tests.
- File-and-folder layout that mirrors upstream `lib/src/<area>/<concept>.dart` so future Dart changes can be tracked diff-by-diff.

### Non-Goals (initial)
- Streaming / chunked-input parsing (upstream doesn't have it either).
- Dart-style `&` / `|` operator overloading — TS can't do this. We provide `seq()`/`or()` plus free-function combinators.
- Bytecode-compiled or WASM "fast path" — `fastParseOn` only.
- Full backwards compatibility with the 2014 API. We will rename to match modern Dart (`undefined_` → `undefined`, `some` → `any`, `chars` → `string`) and document a short migration table for any hypothetical existing user.
- Re-porting the Dart and Smalltalk examples in pass 1 (large, niche, and the upstream Dart example is itself out-of-date).

---

## 2. Current State (one-paragraph summary)

The repo is a 2013/2014 snapshot frozen mid-refactor. ~2,255 LOC across 12 files in `core/`, built with Grunt + TS1.x `module` namespace + triple-slash references; no `tsconfig.json`. Tests are QUnit-in-browser (`core_test.html`) — no Node runner, no CI. `Parser` is non-generic (`any` everywhere). Reflection module is disabled (`// TODO <reference path="core/reflection.ts" />` in the barrel). At least 4 runtime bugs from missing-parentheses on `result.isSuccess`/`isFailure`/`getValue` calls (e.g. `combinators.ts:90`, `actions.ts:21`, `actions.ts:124`, `actions.ts:57`). Missing entirely: `ExpressionBuilder`, `GrammarDefinition`, `allMatches`, typed `seq2..seq9`, `starSeparated`/`plusSeparated`, debug helpers (`trace`/`progress`/`profile`), linter, optimizer, Unicode support, examples directory.

---

## 3. Target Architecture

Mirror upstream `lib/src/<area>/<concept>.dart` as `src/<area>/<concept>.ts`. Each fluent extension method lives in its own file, attached via TypeScript module augmentation so consumers can tree-shake and so new methods are diffable against upstream.

```
src/
  shared/             # types, pragmas (no-op), assertion helpers
  core/
    parser.ts         # abstract Parser<R> (parseOn, fastParseOn, parse, copy, children, replace, isEqualTo)
    context.ts        # immutable Context(buffer, position)
    result.ts         # discriminated union: Success<R> | Failure (no class hierarchy)
    token.ts          # Token<R> with start/stop/line/column/input/length, Token.join
    exception.ts      # ParserException
  parser/
    character/        # any, anyOf, char, digit, letter, lowercase, noneOf, pattern, predicate, range, uppercase, whitespace, word
      predicate/      # CharPredicate impls + lookup tables + ranges
      utils/          # code, optimize
    combinator/       # and, choice, delegate, list, not, optional, sequence, settable, skip
      generated/      # sequence_2.ts .. sequence_9.ts (typed via variadic generics — likely hand-written, not generated)
    repeater/         # character, greedy, lazy, limited, possessive, repeating, separated, unbounded
    action/           # cast, castList, constant, continuation, flatten, map, permute, pick, token, trim, where
    predicate/        # character, converter, pattern, predicate, singleCharacter, string, unicodeCharacter
    misc/             # end, epsilon, failure, label, newline, position
    utils/            # failureJoiner, labeled, resolvable, separatedList, sequential
  expression/         # builder, group, result, utils
  definition/         # grammar (GrammarDefinition), reference (ref0..refN), resolve
  reflection/         # iterable (allParser), transform, optimize, linter, analyzer
  debug/              # trace, progress, profile
  matcher/            # accept, matches (allMatches), pattern
  indent/             # indent (experimental)
  index.ts            # barrel — re-exports everything

examples/
  json/   uri/   math/   lisp/   prolog/   regexp/
  (each: src/, test/, README.md, runnable demo)

test/                 # mirrors src/ layout
benchmark/            # JSON-vs-JSON.parse and friends
docs/                 # tutorial + API reference (typedoc)
```

### Key TypeScript design decisions

1. **Generic `Parser<R>` everywhere.** No `any` in the public surface. `unknown` only at trust boundaries. The `R` parameter flows through every combinator (variadic generics for `seq`).
2. **`Result<T>` as a discriminated union**, not a class hierarchy:
   ```ts
   type Result<R> = Success<R> | Failure;
   interface Success<R> { readonly kind: 'success'; readonly buffer: string; readonly position: number; readonly value: R; }
   interface Failure   { readonly kind: 'failure'; readonly buffer: string; readonly position: number; readonly message: string; }
   ```
   Narrows naturally with `if (r.kind === 'success')`. No `instanceof`. No method-call/parens bugs (the 2014 port's recurring footgun).
3. **Variadic-generic typed sequences** for `seq2..seq9` and a free `seq(...ps)` overload that infers a tuple `[R1, R2, ...Rn]` from `Parser<R1>, Parser<R2>, ...`. Replaces Dart Records.
4. **Options-bag for named args**: `char('a', { ignoreCase: true, unicode: true, message: '...' })`. Consistent across character parsers, `string()`, repeaters, etc.
5. **Fluent API via module augmentation.** Base `Parser<R>` declares only `parseOn` / `fastParseOn` / `parse` / `copy` / `children` / `replace` / `isEqualTo`. Each combinator file (e.g. `parser/repeater/star.ts`) does:
   ```ts
   declare module '../../core/parser' {
     interface Parser<R> { star(): Parser<R[]>; }
   }
   Parser.prototype.star = function () { return new PossessiveRepeatingParser(this, 0, unbounded); };
   ```
   The barrel imports every augmentation file for side effects. Power users can import `core/parser` plus only the combinators they need.
6. **Free-function alternatives** (`seq(p1, p2)`, `or(p1, p2)`, `star(p)`, `not(p)`) for users who prefer functional style and maximum tree-shaking.
7. **Strict mode on day one**: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. ES2022 target. ESM with `"type": "module"`, plus a CJS dual build via `tsup`.
8. **Failure joiner strategy** on `ChoiceParser`: implement `selectLast` (default), `selectFarthest`, `selectFarthestJoined` matching upstream 4.1+.
9. **`fastParseOn(buffer, position): number | -1`** on every parser to mirror upstream's allocation-free fast path. Important for benchmark parity.
10. **Match upstream naming exactly** — `any()`, `string()`, `epsilon()`, `failure()`, `undefined()` (use a function — TS allows this name as an identifier in module scope; alternatively `undefinedParser()`). `noneOf()`, `anyOf()`, `pattern()`, `range()`, `position()`, `newline()`, `label()`. The 2014 port's `some`/`chars`/`stringIgnoreCase`/`undefined_` get retired.

---

## 4. Phased Roadmap

Each phase ends in green CI, published artifact, and a CHANGELOG entry. Phases are sequenced for dependency, not for calendar — each is a discrete shippable milestone.

### Phase 0 — Foundation (build, tooling, repo hygiene)
- Delete Grunt, `dist/`, `.tsc` placeholders, browser QUnit harness.
- Add `tsconfig.json` (strict, ES2022, ESM, declaration files), `tsup.config.ts` (dual ESM/CJS), `vitest.config.ts`, `eslint.config.js` (typescript-eslint flat config), `prettier`, `package.json` rewritten with proper `exports` map, `engines: { node: '>=20' }`, MIT license preserved with original 2013 Renggli copyright + new contributor lines.
- GitHub Actions: lint + typecheck + test on Node 20 / 22, publish-on-tag workflow.
- `CHANGELOG.md` (Keep-a-Changelog), `CONTRIBUTING.md`, updated `README.md` pointing at modernization status.
- Decide and document the package name (likely `@iotone/petitparser` or `petitparser` if available — confirm with maintainer before publish).

**Exit criteria:** `pnpm install && pnpm test` is green on a no-op test. CI green on PR.

### Phase 1 — Core rewrite (shared / core / minimal primitives)
- `src/core/`: `Parser<R>`, `Context`, discriminated-union `Result<R>`, `Token<R>`, `ParserException`. Implement `parseOn`/`fastParseOn`/`parse`/`accept`/`isEqualTo`/`children`/`replace`.
- `src/parser/misc/`: `epsilon`, `failure`, `end`, `position`, `newline`, `label`.
- `src/parser/character/`: `any`, `char`, `digit`, `letter`, `lowercase`, `uppercase`, `whitespace`, `word`, `range`, `pattern`, `anyOf`, `noneOf`, `predicate`. Lookup-table `CharPredicate` infrastructure with the union/intersection/negation algebra upstream uses for `pattern()`. **Skip Unicode/surrogate-pair support in this phase** — defer to Phase 7.
- `src/parser/predicate/string.ts`: `string(s, { ignoreCase, message })`.
- Vitest port of the existing 132 QUnit tests, plus tests for the **4 known bugs** from the 2014 port (regression coverage).

**Exit criteria:** All character/primitive/end/epsilon tests green. Type-level test (`expectTypeOf`) confirms `digit().parse('1').value` narrows to `string`.

### Phase 2 — Combinators & repeaters
- `src/parser/combinator/`: `sequence`, `choice` (with failure joiner strategies), `optional`, `and`, `not`, `delegate`, `list`, `settable`, `skip`.
- `src/parser/combinator/generated/sequence_2.ts ... sequence_9.ts`: hand-written variadic-typed `seq2`..`seq9` returning `Parser<readonly [R1,R2,...]>`.
- Variadic `seq(...ps)` and `or(...ps)` free functions with full tuple inference.
- `src/parser/repeater/`: `repeating`, `possessive`, `greedy`, `lazy`, `limited`, `unbounded`, plus `separated` (`starSeparated`/`plusSeparated`/`timesSeparated`/`repeatSeparated` returning typed `SeparatedList<R, S>`).
- `src/parser/repeater/character.ts`: fast-path `starString`/`plusString`/`timesString`/`repeatString`.
- Module-augmentation files for fluent forms: `.seq()`, `.or()`, `.star()`, `.plus()`, `.optional()`, `.times()`, `.repeat()`, `.and()`, `.not()`, `.neg()`, `.starSeparated()`, etc.

**Exit criteria:** Type tests prove `seq(digit(), letter())` infers `Parser<readonly [string, string]>`. `starSeparated(comma)` infers `Parser<SeparatedList<R, ','>>`. All combinator tests from upstream's `test/` directory ported and green.

### Phase 3 — Actions, matcher, definition (grammar reuse)
- `src/parser/action/`: `map`, `pick`, `permute`, `flatten`, `token`, `trim`, `cast`, `castList`, `where`, `callCC`, `constant`, `labeled`.
- `src/matcher/`: `accept`, `allMatches` (lazy iterator with `start` and `overlapping` options), `toPattern` (returns a RegExp-compatible matcher object).
- `src/definition/grammar.ts`: `GrammarDefinition<R>` with `start()`, `build()`, `buildFrom<T>(parser)`. Use class subclassing exactly like upstream.
- `src/definition/reference.ts`: `ref0`..`refN` free functions.
- `src/definition/resolve.ts`: walk graph, replace `SettableParser` placeholders with real parsers, detect unresolved refs.
- Replace the old `CompositeParser` with a deprecation shim that delegates to `GrammarDefinition` (or remove outright — there is no published consumer to break).

**Exit criteria:** Can define a recursive grammar (e.g. `expr := number | '(' expr ')'`) using `GrammarDefinition`. `buildFrom` works for partial-grammar testing. All matcher tests green.

### Phase 4 — ExpressionBuilder
- `src/expression/builder.ts`: `ExpressionBuilder<T>` with `primitive(parser)`, `group(builder => …)`, public `loopback`.
- `src/expression/group.ts`: `wrapper(left, right, builder)`, `prefix(op, builder)`, `postfix(op, builder)`, `left(op, builder)`, `right(op, builder)`, `optional(builder)`.
- `src/expression/result.ts`: typed `ExpressionResultPrefix/Postfix/Infix`.
- Port upstream's expression-builder tests verbatim.

**Exit criteria:** A 30-line math grammar (`+`, `-`, `*`, `/`, `^`, unary `-`, parens) parses and evaluates correctly with full operator-precedence semantics. Acts as the integration test for Phase 6's Math example.

### Phase 5 — Reflection & debug
- `src/reflection/iterable.ts`: `allParser(root)` depth-first traversal.
- `src/reflection/transform.ts`: `transformParser(root, handler)` with generic-preserving handler (TS-equivalent: pass `<T>` through a callback signature; document that erased generics make this less load-bearing than in Dart).
- `src/reflection/optimize.ts`: `optimize(parser, { rules })` plus the upstream rule registry: `CharacterRepeater`, `FlattenChoice`, `RemoveDelegate`, `RemoveDuplicate`.
- `src/reflection/linter.ts`: `linter()` with `LinterRule`/`LinterIssue`/`LinterType` and the upstream rule registry (left recursion, nullable repeater, overlapping/repeated/unreachable choice, unresolved settable, unnecessary flatten/resolvable, unused result, duplicate parser).
- `src/reflection/analyzer.ts`: `Analyzer` with nullability, FIRST/FOLLOW/cycle sets, paths.
- `src/debug/{trace,progress,profile}.ts`: emit structured `TraceEvent`/`ProgressFrame`/`ProfileFrame` objects with an `output` callback and `predicate` filter (do not just `console.log` strings — match upstream).

**Exit criteria:** Linter catches a deliberately left-recursive grammar in tests. `optimize()` collapses a deeply nested choice tree. `profile()` returns per-parser activation counts for a JSON parse.

### Phase 6 — Examples (port from `dart-petitparser-examples`)
Each example lives under `examples/<name>/` with `src/`, `test/`, and a runnable demo (`node --import tsx examples/json/demo.ts`). Each is also wired into the main test suite as integration coverage.

Port order (drives API stress-testing, easiest → hardest):
1. **JSON** — canonical, tiny, benchmark vs `JSON.parse`. Validates `seq`/`or`/`star`/`trim`/`map`/`flatten`.
2. **URI** — smallest, validates `Token` + line/column.
3. **Math** — hero example for `ExpressionBuilder`. Validates Phase 4.
4. **Regexp** — mini-language interpreter; validates idiom diversity.
5. **Lisp** (with simple REPL) — validates large-grammar ergonomics.
6. **Prolog** (with evaluator) — validates `GrammarDefinition` at scale.

**Defer:** Pascal (single-file 10KB grammar — useful soak test, low demo value), BibTeX (niche), Smalltalk (25KB, very niche), Dart (28KB, upstream itself flags it as out-of-date).

**Exit criteria:** Each example parses upstream's golden inputs to byte-identical ASTs (where applicable) and round-trips for examples that have a `toString`/printer. JSON example benchmarked vs `JSON.parse` published in `benchmark/README.md`.

### Phase 7 — Unicode, indent-sensitive, polish
- Unicode/surrogate-pair support: add `unicode: true` named option to character parsers, mirroring upstream 7.0.0's breaking-change consolidation.
- `src/indent/indent.ts` — experimental `Indent` with `increase`/`same`/`decrease` parsers (mark `@experimental` in TSDoc).
- `Parser.constant(value)` (upstream 7.0.2).
- API docs site via TypeDoc, deployed to GitHub Pages.
- Tutorial doc (`docs/tutorial.md`) — TS port of upstream's tutorial, using JSON example as the running thread.

**Exit criteria:** v1.0.0 published to npm. Docs site live. README links to the live tutorial and runnable examples.

### Phase 8 — Ongoing maintenance
- Track upstream Dart releases. Aim for a minor version bump within ~30 days of any upstream feature release (subscribe to repo).
- Quarterly dependency bumps (Vitest, tsup, TypeScript).
- Issue triage SLO + contribution guide.

---

## 5. Cross-Cutting Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Module system | ESM-first with CJS dual build | Modern Node, but unblock CJS consumers. |
| Min Node | 20 LTS | Ships fetch, native test runner alternative, top-level await. |
| Test runner | Vitest | Fast, ESM-native, snapshot, type-level via `expectTypeOf`. |
| Bundler | `tsup` (esbuild under the hood) | Single config for ESM + CJS + `.d.ts`. |
| Lint/format | typescript-eslint flat config + Prettier | Standard, low-config. |
| TS version | 5.6+ | Need variadic generics, `const` type parameters, `satisfies`. |
| TS strictness | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` + `noImplicitOverride` | Catch the 2014-port-style bugs at compile time. |
| Operator overloading (`&`, `|`) | Skip; provide method + free-function combinators | Not possible in TS. |
| Named args | Options-bag object as last arg | Idiomatic TS. |
| Dart `Pattern` interop | Skip; use `accept(input)` + `allMatches` + `toPattern()` (returns RegExp-compatible) | No equivalent platform interface. |
| Streaming input | Out of scope | Upstream doesn't have it. |
| `dynamic` / `Object?` returns | Use `unknown` at boundaries, generics elsewhere | Type safety, but no false precision. |
| Failure representation | Discriminated union, not class | Better narrowing, no method-call bugs. |
| Performance | Benchmark JSON parse vs `JSON.parse`; aim for <10× slowdown | Realistic target for a combinator library. |
| Backwards compat with 2014 API | None | Zero published consumers. Document as a from-scratch v1.0. |

### Naming-table (2014 port → modern TS port)

| 2014 port | Modern TS port | Notes |
|---|---|---|
| `some()` | `any()` | Match Dart. |
| `chars(s)` | `string(s)` | Match Dart. |
| `stringIgnoreCase(s)` | `string(s, { ignoreCase: true })` | Options-bag. |
| `undefined_()` | `undefined()` (or `undefinedParser()` if export name collides) | Decide late; both legal. |
| `CompositeParser` | `GrammarDefinition` | Match Dart. |
| `def`/`ref`/`redef`/`action` | `start()` + `ref0..refN` | Match Dart. |
| `separatedBy(sep, ...)` | `starSeparated(sep)` / `plusSeparated(sep)` | Typed `SeparatedList`. |
| `matches(input)` / `matchesSkipping(input)` | `allMatches(input, { overlapping })` | Single lazy iterator. |
| `Result.isSuccess()` (method) | `result.kind === 'success'` (discriminant) | Eliminates the missing-parens bug class. |

---

## 6. Risks & Open Questions

1. **Generic preservation through `transformParser`.** Dart uses `captureResultGeneric<T>` to recover erased generics at the boundary. TS erasure is total — we cannot recover `R` from a `Parser<unknown>`. Document that `transformParser` callers receive `Parser<unknown>` and must cast at the boundary; provide a typed convenience helper for the common case (transforming a known subtype).
2. **Operator overloading absence** changes the look of Dart-style examples. Mitigation: every doc snippet uses methods (`p1.seq(p2)`) or free functions (`seq(p1, p2)`) — both already taught upstream.
3. **Module-augmentation scaling.** With ~50 fluent methods, augmentation files multiply. Mitigation: barrel + side-effect imports; document that "import from `petitparser`" gets the full fluent surface, while à-la-carte imports are an advanced feature.
4. **Variadic generic ergonomics for `seq`.** `seq(...ps: Parser<R>[]) → Parser<R[]>` is easy; `seq(p1: Parser<R1>, p2: Parser<R2>) → Parser<[R1, R2]>` requires `<T extends readonly Parser<unknown>[]>` plus a mapped tuple type. Some IDEs render the inferred type as a long `{ [K in keyof T]: ... }` blob. Provide explicit `seq2..seq9` overloads as in Dart for readability.
5. **Package name.** `petitparser` on npm is unowned as of last check, but verify before Phase 0. Fall back to `@iotone/petitparser` (or another scoped name agreed with the maintainer).
6. **Original author attribution.** The 2013 commit is by Rasmus Schultz; we should keep his copyright in `LICENSE` and credit upstream Renggli as the originator of the design. Optionally reach out to Rasmus before tagging v1.0.0 to confirm he's happy with the revival.
7. **Performance.** No benchmark exists. Decide acceptable slowdown vs `JSON.parse` (proposal: 10× for first cut, optimize in later phases via `fastParseOn` and `optimize()`). Set the benchmark gate in CI early so regressions are visible.
8. **Indent-sensitive parsing** is `@experimental` upstream — port it but mark it experimental in TSDoc; don't block v1.0.0 on it being polished.
9. **Examples that depend on other Dart packages.** Upstream's XML example lives in the separate `dart-xml` package and isn't suitable for inclusion. Skip.

---

## 7. Suggested First PR

Smallest viable starting move (single PR, foundation only):

1. Add `tsconfig.json`, `package.json` rewrite, `vitest.config.ts`, `tsup.config.ts`, `eslint.config.js`, `.github/workflows/ci.yml`.
2. Move 2014 source under `legacy/` for reference (don't delete — it's useful for cross-checking behavior).
3. Add a stub `src/core/parser.ts` with the new generic `Parser<R>` skeleton + a single passing test.
4. Update `README.md` with the modernization plan link and current status.

This unblocks every subsequent phase without forcing decisions about the public API.
