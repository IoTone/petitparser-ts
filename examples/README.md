# Examples

Real-world parsers built on top of `petitparser-ts`. Each example is a self-
contained TypeScript module under `examples/<name>/src/`, with a matching
test suite under `examples/<name>/test/` that runs as part of `pnpm test`.

| Example | Demonstrates |
| --- | --- |
| [`json/`](./json) | `GrammarDefinition`, `seq`/`or`/`star`/`map`/`flatten`, escape handling, recursive structures |
| [`uri/`](./uri) | Optional sub-parsers, `noneOf`/`anyOf` character classes, structured-result mapping |
| [`math/`](./math) | `ExpressionBuilder` with prefix, infix (left + right associative), and wrappers |
| [`lisp/`](./lisp) | Recursive list AST, quote sugar, `;`-line comments, plus a tree-walking evaluator with closures and special forms |
| [`prolog/`](./prolog) | List sugar (`[H \| T]`) desugaring to `'.'/2`, classical unification with optional occurs check, SLD resolution with generator-based backtracking |

Ports of the larger upstream Dart examples (Regexp, Smalltalk, Pascal, Dart)
are not in this fork yet — see the modernization plan for the priority order
if you want to add one.

## Running

The examples live alongside the library, not inside the published package.
Run their tests via the top-level `pnpm test` (they're picked up by
`vitest.config.ts`'s `examples/**/*.test.ts` glob).

## Importing in your own code

The examples import from the source tree (`../../../src/...`) rather than the
built package, so they double as integration tests for the public API. To use
one in your own project, copy the relevant `src/` directory and rewrite the
imports to point at `@iotone/petitparser`.
